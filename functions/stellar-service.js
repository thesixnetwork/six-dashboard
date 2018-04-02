const functions = require('firebase-functions')
const StellarSdk = require('stellar-sdk')
const admin = require('firebase-admin')
const Promise = require('bluebird')
const fireStore = admin.firestore()

function StellarService(event) {
  this.stellarUrl = functions.config().campaign.is_production === 'true'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org'
  this.address = functions.config().xlm.address

  const server = new StellarSdk.Server(this.stellarUrl);

  return getCursor().then((cursor) => {
    return server.payments()
      .forAccount(this.address)
      .order("desc")
      .limit(200)
      .call()
      .then((payments) => {
        const recordPromise = [];
        for (let i = 0; i < payments.records.length; i++) {
          if (new Date(payments.records[i].created_at).getTime() <= cursor) {
            break;
          }

          recordPromise.push(payments.records[i].transaction()
            .then(findUser)
            .then(findPrice)
            .then((body) => {
              const tx = body.tx
              const user = body.user
              const price = body.price
              const timeZero = body.timeZero

              tx.operations()
                .then((operations) => {
                  const records = operations._embedded.records
                  const operationLength = operations._embedded.records.length
                  const operationTxs = []

                  for (let j = 0; j < operationLength; j++) {
                    if (records[j].type !== 'payment') {
                      continue
                    }
                    if (records[j].to !== this.address) {
                      continue
                    }
                    operationTxs.push(handleOperation(user, tx, records[j], j, price, timeZero))
                  }

                  return Promise.all(operationTxs)
                }).then((update) => {
                const newTime = new Date(payments.records[i].created_at).getTime()

                if (newTime <= cursor) {
                  return update
                }

                return updateCursor(newTime)
              })
            })
          )
        }
        return Promise.all(recordPromise)
      })
  })
}

function updateCursor(newTime) {
  console.log("cursor updating  = ", JSON.stringify(newTime, null, 4));
  return fireStore
    .collection('latest_block_sync')
    .doc('xlm')
    .set({
      ts: newTime
    })
}

function handleOperation(user, tx, operation, n, price, priceTime) {
  const hash = tx.hash
  const id = `${hash}_${n}`
  const memo = tx.memo || ''
  const native_amount = +operation.amount
  const six_amount = +(operation.amount * price.six_per_xlm).toFixed(7)
  const from = tx.source_account
  const to = operation.to
  const type = 'xlm'
  const total_usd_price = price.price * (+operation.amount)
  const price_time = priceTime
  const time = new Date(tx.created_at).getTime()
  const xlm_meta = {
    tx_id: hash,
    operation_id: operation.id,
    operation_number: n
  }

  const body = {
    id,
    time,
    price_time,
    total_usd_price,
    to,
    from,
    native_amount,
    six_amount,
    type,
    memo,
    xlm_meta
  }

  if (!user) {
    return fireStore
      .collection('undefined_purchase_txs')
      .doc(`${hash}_${operation.id}`)
      .set(body)
  }


  const user_id = user.id
  body.user_id = user_id

  return firestore.runTransaction(transaction => {
    let documentRef = firestore
      .collection('purchase_txs')
      .doc(`${hash}_${operation.id}`);

    return transaction.get(documentRef).then(doc => {
      if (!doc.exists) {
        return transaction.create(documentRef, body);
      }
    });
  });
}

function findUser(tx) {
  if (!tx.hasOwnProperty('memo')) {
    return {
      tx
    }
  }
  return fireStore
    .collection('users')
    .where('xlm_memo', '==', tx.memo)
    .get()
    .then((snapshot) => {
      const users = [];
      snapshot.forEach((user) => {
        let _user = user.data()
        _user.id = user.id
        users.push(_user)
      })
      return {
        tx,
        user: users[0]
      }
    })
}

function findPrice(body) {
  const tx = body.tx
  const user = body.user
  const time = new Date()
  let timeZero = time.setMinutes(0, 0, 0)

  return fireStore
    .collection('xlm_prices')
    .doc(timeZero.toString())
    .get()
    .then(snapshot => snapshot.data())
    .then((price) => {
      if (!price.price) {
        timeZero = time.setHours(time.getHours() - 1, 0, 0, 0)
        fireStore
          .collection('xlm_prices')
          .doc(timeZero.toString())
          .get()
          .then(snapshot => snapshot.data())
          .then((price) => {
            return {
              tx,
              user,
              timeZero,
              price
            }
          })
      }

      return {
        tx,
        user,
        timeZero,
        price
      }
    })

}

function getCursor() {
  return fireStore
    .collection('latest_block_sync')
    .doc('xlm')
    .get()
    .then(snapshot => snapshot.data())
    .then(doc => {
      return doc.ts
    })
}
module.exports = StellarService;
