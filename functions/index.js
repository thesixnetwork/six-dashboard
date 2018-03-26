const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const functions = require('firebase-functions')
const request = require('request-promise')
const moment = require('moment-timezone')
// const serviceAccount = require('./service-account')

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://six-dashboard.firebaseio.com'
// })

admin.initializeApp(functions.config().firebase)

const EthereumService = require('./service-ethereum')
const stellarService = require('./stellar-service')

const fireStore = admin.firestore()
const app = express()

const triggers = require('./trigger')(functions, fireStore)
for (let trigger of triggers) {
  exports[trigger.name] = trigger.module
}

app.use(cors())
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

const getBasePriceURI = (coin) => `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=USD`

function getUser (uid) {
  return new Promise((resolve, reject) => {
    fireStore
      .collection('users')
      .doc(uid)
      .get()
      .then(snapshot => snapshot.data())
      .then(result => resolve(result))
      .catch(err => reject(err))
  })
}

function updateUser (uid, data) {
  return new Promise((resolve, reject) => {
    fireStore
      .collection('users')
      .doc(uid)
      .set(data, {
        merge: true
      })
      .then(snapshot => snapshot.data())
      .then(result => resolve(result))
      .catch(err => reject(err))
  })
}

function insertUserTx (uid, data) {
  return getUser(uid)
    .then(result => {
      const {xlm_tx} = result
      let txs = xlm_tx || []
      txs = txs.concat([data])
      return updateUser(uid, {
        xlm_tx: txs
      })
    })
    .catch(err => err)
}

app.use('/users/:uid', (req, res) => {
  const {uid} = req.params
  getUser(uid)
    .then(result => res.send(result))
    .catch(err => res.status(400).send(err))
})

app.use('/purchase-list', (req, res) => {
  return fireStore
    .collection('purchase_txs')
    .get()
    .then(querySnapshot => {
      let result = []
      querySnapshot.forEach(function (doc) {
        const data = doc.data()
        result = result.concat([data])
      })
      return result
    })
    .then(result => res.send(result))
    .catch(err => {
      res.status(400).send(err)
    })
})

app.post('/purchase/:currency', (req, res) => {
  const {currency} = req.params
  const {buyer_id, amount, time, total_six, id} = req.body
  const data = {
    buyer_id,
    id,
    amount,
    time,
    total_six,
    currency
  }
  return fireStore
    .collection('purchase_txs')
    .doc(id)
    .set(Object.assign(data, {
      status: 'success'
    }))
    .then(function (result) {
      insertUserTx(buyer_id, data)
      res.send(Object.assign(data, {
        status: 'success'
      }))
    })
    .catch(err => {
      res.status(400).send(err)
    })
})

exports.api = functions.https.onRequest(app)

exports.incrementTotalAsset = functions.firestore.document('/purchase_txs/{txId}')
  .onCreate(event => {
    const data = event.data.data()
    console.log('Create Transaction:', event.params.txId, data.type, data.native_amount)
    const assetCol = fireStore.collection('total_asset')
    return fireStore.runTransaction(tx => Promise.all([
      {type: data.type, key: 'native_amount'},
      {type: 'usd', key: 'total_usd_price'},
      {type: 'six', key: 'six_amount'}
    ].map(asset => {
      const ref = assetCol.doc(asset.type)
      return tx.get(ref).then(assetDoc => tx.update(ref, {total: assetDoc.data().total + data[asset.key]}))
    })
    )
    )
  })

function generatePhoneVerificationCode (phone_number) {
  let refCode = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5).toUpperCase()
  let code = Math.random().toString().substr(2, 6)
  let validUntil = Math.round((new Date()).getTime() / 1000) + 180
  var http = require('https')
  var options = {
    'method': 'POST',
    'hostname': 'tm3swoarp5.execute-api.ap-southeast-1.amazonaws.com',
    'port': null,
    'path': '/production/sms',
    'headers': {
      'content-type': 'application/x-www-form-urlencoded',
      'cache-control': 'no-cache'
    }
  }

  var req = http.request(options, res => {
    var chunks = []

    res.on('data', chunk => {
      chunks.push(chunk)
    })

    res.on('end', () => {
      var body = Buffer.concat(chunks)
      console.log(body.toString())
    })
  })
  req.write('{"message": "Your code is ' + code + ' (Ref: ' + refCode + ')", "phone_number": "' + phone_number + '"}')
  req.end()
  let ref = admin.firestore().collection('phone-verifications')
  return ref.doc(phone_number).set({ ref_code: refCode, code: code, valid_until: validUntil }).then(() => {
    return { success: true, refCode: refCode, validUntil: validUntil }
  }).catch(err => {
    return { success: false, message: err.message }
  })
}

exports.phoneVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let phone_number = data.phone_number
  return ref.doc(phone_number).get().then(doc => {
    if (doc.exists) {
      if (doc.data().is_verified === true) {
        return { success: false, error_message: 'Phone number has already been used' }
      } else {
        return generatePhoneVerificationCode(phone_number).then(data => {
          if (data.success === true) {
            let refCode = data.refCode
            let validUntil = data.validUntil
            return { success: true, ref_code: refCode, valid_until: validUntil }
          } else {
            return { success: false, error_message: 'Unexpected error, please try again' }
          }
        }).catch(() => {
          return { success: false, error_message: 'Unexpected error, please try again' }
        })
      }
    } else {
      return generatePhoneVerificationCode(phone_number).then(data => {
        if (data.success === true) {
          let refCode = data.refCode
          let validUntil = data.validUntil
          return { success: true, ref_code: refCode, valid_until: validUntil }
        } else {
          return { success: false, error_message: 'Unexpected error, please try again' }
        }
      }).catch(() => {
        return { success: false, error_message: 'Unexpected error, please try again' }
      })
    }
  }).catch(err => {
    console.log(err)
    return { success: false, error_message: err.message }
  })
})

exports.phoneVerificationSubmit = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let userRef = admin.firestore().collection('users')
  let phone_number = data.phone_number
  let country = data.country
  let ref_code = data.ref_code
  let code = data.code
  const uid = context.auth.uid
  return ref.doc(phone_number).get().then(doc => {
    if (doc.exists) {
      if (doc.data().is_verified === true) {
        return { success: false, error_message: 'Phone number has already been used' }
      } else {
        if (doc.data().valid_until > Math.round((new Date()).getTime() / 1000)) {
          if (doc.data().ref_code === ref_code && doc.data().code === code) {
            let batch = admin.firestore().batch()
            batch.set(ref.doc(phone_number), {is_verified: true})
            batch.update(userRef.doc(uid), {'phone_number': phone_number, 'phone_verified': true, 'country': country})
            return batch.commit().then(() => {
              return { success: true }
            }).catch(err => {
              return { success: false, error_message: err.message }
            })
          } else {
            return { success: false, error_message: 'Invalid verification code' }
          }
        } else {
          return { success: false, error_message: 'Verification session expired' }
        }
      }
    } else {
      return { success: false, error_message: 'Unexpected error, please try again' }
    }
  }).catch(err => {
    console.log(err)
    return { success: false, error_message: err.message }
  })
})

function updateUser (uid, data) {
  return new Promise((resolve, reject) => {
    fireStore
      .collection('users')
      .doc(uid)
      .set(data, {
        merge: true
      })
      .then(snapshot => snapshot.data())
      .then(result => resolve(result))
      .catch(err => reject(err))
  })
}

function insertUserTx (uid, data) {
  return getUser(uid)
    .then(result => {
      const {xlm_tx} = result
      let txs = xlm_tx || []
      txs = txs.concat([data])
      return updateUser(uid, {
        xlm_tx: txs
      })
    })
    .catch(err => err)
}

app.use('/users/:uid', (req, res) => {
  const {uid} = req.params
  getUser(uid)
    .then(result => res.send(result))
    .catch(err => res.status(400).send(err))
})

app.use('/purchase-list', (req, res) => {
  return fireStore
    .collection('purchase_txs')
    .get()
    .then(querySnapshot => {
      let result = []
      querySnapshot.forEach(function (doc) {
        const data = doc.data()
        result = result.concat([data])
      })
      return result
    })
    .then(result => res.send(result))
    .catch(err => {
      res.status(400).send(err)
    })
})

app.post('/purchase/:currency', (req, res) => {
  const {currency} = req.params
  const {buyer_id, amount, time, total_six, id} = req.body
  const data = {
    buyer_id,
    id,
    amount,
    time,
    total_six,
    currency
  }
  return fireStore
    .collection('purchase_txs')
    .doc(id)
    .set(Object.assign(data, {
      status: 'success'
    }))
    .then(function (result) {
      insertUserTx(buyer_id, data)
      res.send(Object.assign(data, {
        status: 'success'
      }))
    })
    .catch(err => {
      res.status(400).send(err)
    })
})

exports.api = functions.https.onRequest(app)

function getTime () {
  const time = new Date()

  if (time.getMinutes > 55) {
    time.setHours(time.getHours() + 1)
  }

  time.setMinutes(0, 0, 0)

  const timeString = moment.tz(time, 'Asia/Bangkok').toString()

  return {
    unix: time.getTime(),
    string: timeString
  }
}

exports.hourly_xlm = functions.pubsub.topic('hourly-xlm').onPublish((event) => {
  const baseToken = 'xlm'
  return handleHourlyEvent(event, baseToken)
})

exports.hourly_eth = functions.pubsub.topic('hourly-eth').onPublish((event) => {
  const baseToken = 'eth'
  return handleHourlyEvent(event, baseToken)
})

exports.hourly_btc = functions.pubsub.topic('hourly-btc').onPublish((event) => {
  const baseToken = 'btc'
  return handleHourlyEvent(event, baseToken)
})

function handleHourlyEvent (event, baseToken) {
  const time = getTime()
  const uri = getBasePriceURI(baseToken.toUpperCase())

  return request({
    uri,
    method: 'GET',
    json: true
  })
    .then((body) => {
      return updateHourlyPrice(body, baseToken, time)
    })
}

function updateHourlyPrice (body, baseToken, time) {
  const price = body.USD / 0.1
  return fireStore
    .collection(`${baseToken}_prices`)
    .doc(time.unix.toString())
    .set({
      time: time.unix,
      price: body.USD,
      [`six_per_${baseToken}`]: price,
      time_string: time.string
    })
}

exports.monitorETH = functions.pubsub.topic('monitor-eth').onPublish(() => {
  return EthereumService.monitor('0x56b680aB2DD4aC72de49c1bb024964C7cbc56F0c')
})

exports.monitorXLM = functions.pubsub.topic('monitor-xlm').onPublish(stellarService)
