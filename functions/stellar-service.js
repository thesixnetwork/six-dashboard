const functions = require('firebase-functions');
const StellarSdk = require('stellar-sdk')
const admin = require('firebase-admin') //delet
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const Promise = require('bluebird')

let cursor = "2018-03-25T13:41:12Z"

const serviceAccount = require('./service-account')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://six-dashboard.firebaseio.com'
})

const fireStore = admin.firestore() //detelete

fireStore
  .collection('latest_block_sync')
  .doc('xlm')
  .get()
  .then(snapshot => snapshot.data())
  .then(doc => {
    cursor = doc.ts
  })

function StellarService(event) {
  console.log('cursor', cursor)
  this.stellarUrl = 'https://horizon-testnet.stellar.org'
  this.address = 'GDJGQJHY3FNOP7P3BBSUHDKP5NMZL7FABPCBFE7W3OTDVEHEQMVX6B32'
  //this.stellarUrl = functions.config().campaign.is_production === 'true' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
  //this.address = functions.config().xlm.address

  return server.payments().forAccount(this.address).order("desc").call().then((payments) => {
    const records = [];
    for (let i = 0; i < payments.records.length; i++) {
      if (new Date(payments.records[i].created_at).getTime() <= new Date(cursor).getTime()) {
        break;
      }

      records.push(payments.records[i].transaction().then(findUser).then(findPrice).then((body) => {
        const tx = body.tx
        const user = body.user
        const price = body.price
        const timeZero = body.timeZero

        tx.operations().then((operations) => {
          const records = operations._embedded.records
          const operationLength = operations._embedded.records.length
          for (let j = 0; j < operationLength; j++) {
            if (records[j].type !== 'payment') {
              continue
            }
            if (records[j].to !== this.address) {
              continue
            }
            return handleOperation(user, tx, records[j], j, price, timeZero)
          }

        }).then((update) => {
          if (new Date(payments.records[i].created_at).getTime() <= cursor) {
            return update
          }

          return updateCursor(payments, i)
        })
      })
      )
    }
    return Promise.all(records)
  })
}

function updateCursor(payments, i) {
  return fireStore
    .collection('latest_block_sync')
    .doc('xlm')
    .get({
      ts: payments.records[i].created_at
    })
}

function handleOperation(user, tx, operation, n, price, priceTime) {
  const hash = tx.hash
  const id = `${hash}_${n}`
  const memo = tx.memo || ''
  const native_amount = +operation.amount
  const six_amount = +(operation.amount * price.six_per_xlm).toFixed(7)
  const receive_account = tx.source_account
  const type = 'xlm'
  const total_usd_price = price.price
  const price_time = priceTime;
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
    receive_account,
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

  return fireStore
    .collection('purchase_txs')
    .doc(`${hash}_${operation.id}`)
    .set(body)
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
module.exports = StellarService;
