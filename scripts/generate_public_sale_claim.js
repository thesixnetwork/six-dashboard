const admin = require('firebase-admin')
const uuid = require('uuid/v5')
const _ = require('underscore')
const fs = require('fs')
const readline = require('readline')
const configPath = __dirname + '/config/config.json'
const privateUserPath = __dirname + '/output/private_sale.json'
const privateTxsPath = __dirname + '/output/private_sale_txs.json'
const privateUsers = require(privateUserPath)
const serviceAccount = require(configPath)
const privateTxs = require(privateTxsPath)
const publicUser = []

const publicTxsPath = __dirname + '/output/public_sale.json'

const conditions = {
  'first_day_trade': 1528275600000
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://six-dashboard.firebaseio.com'
})
const db = admin.firestore()
const batchCount = 0
const batch = 500
let currentNo = 0
const totalUser = 6916

async function listAllUsers (nextPageToken) {
  // List batch of users, 1000 at a time.
  admin
    .auth()
    .listUsers(batch, nextPageToken)
    .then(listUsersResult => {
      const promiseMap = listUsersResult
        .users
        .map(userRecord => {
          return findTxByUid(userRecord.uid)
            .then(async (txs) => {
              const presaleTxs = await findPresaleByUid(userRecord.uid)
              return {
                txs,
                presale_txs: presaleTxs
              }
            })
            .then(txs => {
              return groupTxs(txs.txs, txs.presale_txs, privateTxs)
            })
            .then(txs => {
              const fmt = formatTxs(txs, userRecord.uid)
              return fmt
            })
            .then(txs => {
              currentNo++
              writeSuperBeautifulPrompt((currentNo / totalUser), `user: ${userRecord.uid}`)
              const claimPeriodsGroup = mergeTxs(txs.claim_periods)
              txs.claim_periods = claimPeriodsGroup
              return txs
            })
        })
      Promise.all(promiseMap)
      .then(docs => {
        const userTxs = _.filter(docs, doc => doc.claim_periods.length > 0)
        publicUser.push(...userTxs)
        if (listUsersResult.pageToken) {
        // List next batch of users.
          listAllUsers(listUsersResult.pageToken)
        } else {
          const jsonUser = JSON.stringify(publicUser, null, 2)
          fs.writeFileSync(publicTxsPath, jsonUser)
          console.log('done')
          process.exit()
        }
      })
    })
    .catch(function (error) {
      console.log('Error listing users:', error)
    })
}

function findTxByUid (uid) {
  return new Promise((resolve, reject) => {
    db
      .collection('purchase_txs')
      .where('user_id', '==', uid)
      .onSnapshot(querySnapshot => {
        var txs = []
        querySnapshot
          .forEach(function (doc) {
            const data = doc.data()
            data.buy_period_type = 'ico'
            txs.push(data)
          })
        resolve(txs)
      })
  })
}

function findPresaleByUid (uid) {
  return db
    .collection('presale')
    .doc('supply')
    .collection('purchased_presale_tx')
    .doc(uid)
    .get().then(doc => {
      if (doc.exists) {
        return doc.data()
      }
      return {}
    })
}

function groupTxs (icoTxs, presaleTxs, privateTxs) {
  const validTxs = _.filter(icoTxs, (tx) => {
    return privateTxs.indexOf(tx.id) === -1
  })
  return validTxs.map(tx => {
    if (presaleTxs[tx.id]) {
      tx.buy_period_type = 'presale'
      tx.bonus = presaleTxs[tx.id].bonus
      tx.total = presaleTxs[tx.id].total
    }
    return tx
  })
}

function mergeTxs (claimTxs) {
  const group = _.groupBy(claimTxs, (d) => {
    return d.type
  })
  return _.map(group, (g) => {
    return {
      type: g[0].type,
      valid_after: conditions.first_day_trade,
      amount: _.reduce(g, function (memo, _g) { return memo + _g.amount }, 0)
    }
  })
}

function formatTxs (txs, uid) {
  const obj = {
    uid,
    claim_periods: []
  }
  txs.map(tx => {
    const txObj = {
      type: tx.buy_period_type,
      tx_id: tx.id
    }
    if (tx.buy_period_type === 'ico') {
      txObj.amount = tx.six_amount
      txObj.bonus = null
      txObj.normal_six = null
      txObj.bonus_six = null
    }
    if (tx.buy_period_type === 'presale') {
      txObj.amount = tx.six_amount + tx.bonus
      txObj.bonus = 6
      txObj.normal_six = tx.six_amount
      txObj.bonus_six = tx.bonus
    }
    obj.claim_periods.push(txObj)
  })
  return obj
}
// Start listing users from the beginning, 1000 at a time.
function writeSuperBeautifulPrompt (p, msg = '') {
  readline.clearLine(process.stdout, 0)
  readline.cursorTo(process.stdout, 0, null)
  const l = 20
  const pipeStr = '|'
  const remainingStr = '.'
  const progress = pipeStr.repeat(Math.floor(p * l))
  const remaining = remainingStr.repeat(Math.ceil((1 - p) * l))
  const text = `\u001b[1;36mwaiting ... [${progress}${remaining}] (${(p * 100).toFixed(1)}%)\u001b[0m - ${msg}`
  process.stdout.write(text)
}

listAllUsers()
