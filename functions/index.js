const Querystring = require('query-string')
const admin = require('firebase-admin')
const axios = require('axios')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const functions = require('firebase-functions')
const request = require('request-promise')
const moment = require('moment-timezone')

const serviceAccount = require('./service-account')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://six-dashboard.firebaseio.com'
})

const fireStore = admin.firestore()
const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

const BASE_URL = 'https://sixnetwork.api-us1.com'
const API_KEY = '3a2ccae1fc73e46759aa88291b3b7179282f77acf2e87fb77a26237a18b7335082a0b2d2'

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
    .collection('order-histories')
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
    .collection('order-histories')
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

exports.sendCampaignEmail = functions.database
  .ref('/users/{uid}')
  .onCreate(event => {
    const snapshot = event.data
    const data = snapshot.val()
    const {email, firstName, lastName, phone} = data
    const queryString = `email=${email}&first_name=${firstName}&last_name=${lastName}&phone=${phone}`
    const postObj = Querystring.stringify({
      email: email,
      fist_name: firstName,
      last_name: lastName,
      phone: phone
    })
    const url = `${BASE_URL}/admin/api.php?api_action=contact_add&api_key=${API_KEY}&api_output=json`
    return axios
      .post(url, postObj)
      .then(res => res.data)
      .then(data => {
        console.log(data, 'res from activecampaign')
      })
      .catch(err => console.log(err, 'error send email'))
  })

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
    .collection(`${baseToken}-prices`)
    .doc(time.unix.toString())
    .set({
      time: time.unix,
      price: body.USD,
      [`six_per_${baseToken}`]: price,
      time_string: time.string
    })
}

exports.getUniqueId = functions.https.onRequest((req, res) => {
  var ref = admin.database().ref('/users/lastUserId')
  ref.transaction(function (current) {
    return (current || 0) + 1
  }, function (error, committed, snapshot) {
    if (error || !committed || !snapshot) {
      console.error('Transaction failed abnormally!', error || '')
      res.status(400).send(error)
    } else {
      console.log('Generated ID: ', snapshot.val())
    }
    res.status(200).send(snapshot.val().toString())
  })
})
