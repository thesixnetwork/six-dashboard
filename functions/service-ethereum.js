const _ = require('lodash')
const Web3 = require('web3')
const admin = require('firebase-admin')
const bluebird = require('bluebird')

const web3 = new Web3()

let api = require('etherscan-api').init('IG895QW58QRX3ENJ6MDFZTM4B3AF2UA6EZ', 'ropsten')

const db = admin.firestore()

function getBudget () {
  let time = new Date()
  time.setMinutes(0, 0, 0)
  let docRef = db.collection('eth_prices').doc(time.getTime() + '')
  console.log('getBudget = ', time.getTime())
  return docRef.get()
    .then(doc => {
      if (!doc.exists) {
        return
      }
      return doc.data()
    })
    .then(doc => {
      if (doc) {
        return doc
      }
      time.setHours(time.getHours() - 1)
      console.log('retry getBudget = ', time.getTime())
      // if decrease 1 hours still error throw and done program
      return db.collection('eth_prices').doc(time.getTime() + '').get()
        .then(doc => {
          if (!doc.exists) {
            return
          }
          return doc.data()
        })
    })
}

function getBlockNumber () {
  let docRef = db.collection('latest_block_sync').doc('eth')
  return docRef.get()
    .then((querySnapshot) => {
      return _.get(querySnapshot.data(), 'block_number', 'latest')
    })
}

function updateBlockNumber (latestBlockNumber) {
  let docRef = db.collection('latest_block_sync').doc('eth')
  return docRef.set({
    block_number: latestBlockNumber
  })
}

function savePurchaseTxs (transactionId, data) {
  let col = 'purchase_txs'
  if (!data.user_id) {
    col = 'undefined_purchase_txs'
  }
  return db
    .collection(col)
    .doc(transactionId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return db.collection(col).doc(transactionId).set(data)
      }
    })
}

function userByUserNumber (userNumber) {
  return db.collection('users')
    .where('user_number', '==', userNumber)
    .get()
    .then(snapshot => {
      if (!snapshot) {
        return null
      }
      let userId
      snapshot.forEach(doc => {
        userId = doc.id
      })
      return userId
    })
}

function filterTransactions (transactions, contractAddress) {
  let _transactions = transactions.map((transaction) => {
    if (transaction.isError === '1') {
      console.log('transaction error', transaction)
      return null
    }
    if (transaction.to !== contractAddress) {
      return null
    }
    const inputText = web3.toAscii(transaction.input)
    console.log('inputText = ', inputText)
    try {
      const _memo = JSON.parse(inputText)
      if (_memo.n) {
        transaction.user_number = _memo.n
      }
      return transaction
    } catch (err) {
      return transaction
    }
  })
  _transactions = _.compact(_transactions)
  return _transactions
}

function mapUserTransactions (transactions, contractAddress) {
  return bluebird.map(transactions, (transaction) => {
    // Promise.map awaits for returned promises as well.
    if (!transaction.user_number) {
      return transaction
    }
    return userByUserNumber(transaction.user_number)
      .then((userId) => {
        console.log('userId = ', userId)
        if (!userId) {
          transaction.user_number = transaction.user_number
          return transaction
        }
        transaction.user_id = userId
        return transaction
      })
  })
}

function monitor (contractAddress) {
  contractAddress = contractAddress.toLowerCase()
  // latestBlockNumber for update to latest in firebase
  let latestBlockNumber

  getBlockNumber()
    .then((blockNumber = 'latest') => {
      console.log('block number = ', blockNumber)
      return api.account.txlist(contractAddress, blockNumber, 'latest', 'desc')
    })
    .then(function (txData) {
      let transactions = _.get(txData, 'result', [])
      console.log('transactions.length', transactions.length)
      if (transactions.length === 0) {
        return
      }
      latestBlockNumber = transactions[0].blockNumber
      transactions = filterTransactions(transactions, contractAddress)
      return transactions
    })
    .then((transactions) => {
      // mapping user_number to user object from firebase
      return mapUserTransactions(transactions)
    })
    .then((transactions) => {
      // getting budget
      return getBudget()
        .then((budget) => {
          return { budget, transactions }
        })
    })
    .then(({ transactions, budget }) => {
      console.log('transactions.length = ', transactions.length)
      console.log('budget = ', budget)
      const promises = []
      for (let transaction of transactions) {
        const value = web3.fromWei(transaction.value, 'ether').toString(10)
        let result = {
          'id': transaction.hash,
          'native_amount': +value,
          'to': transaction.to,
          'from': transaction.from,
          'price_time': budget.time,
          'six_amount': value * budget.six_per_eth,
          'time': new Date().getTime(),
          'total_usd_price': value * budget.price,
          'type': 'eth'
        }
        if (transaction.user_id) {
          result.user_id = transaction.user_id
        }
        if (transaction.input) {
          result.memo = transaction.input || undefined
        }
        if (transaction.user_number) {
          result.user_number = transaction.user_number || undefined
        }
        console.log('result = ', result)
        promises.push(savePurchaseTxs(transaction.hash, result))
      }
      return Promise.all(promises)
    })
    .then(() => {
      if (latestBlockNumber) {
        return updateBlockNumber(latestBlockNumber)
      }
    })
    .catch((err) => {
      console.error('error', err)
    })
}

exports.monitor = monitor
