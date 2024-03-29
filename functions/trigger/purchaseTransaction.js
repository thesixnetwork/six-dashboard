const path = '/purchase_txs/{txId}'
const emailTemplate = require('./static')
const nodemailer = require('nodemailer')
const moment = require('moment-timezone')
module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [
    {
      'name': 'incrementTotalAsset',
      'module': events.onCreate(event => incrementTotalAsset(event, fireStore))
    }, {
      'name': 'updateTotalSix',
      'module': events.onCreate(event => updateTotalSix(event, fireStore))
    }, {
      'name': 'receivedDeposit',
      'module': events.onCreate(event => receivedDeposit(event, functions, fireStore))
    }
  ]
}

function incrementTotalAsset (event, fireStore) {
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
}

function updateTotalSix(event, fireStore) {
  const purchaseTxData = event.data.data()
  const userCol = fireStore.collection('users')
  return fireStore.runTransaction(tx => {
    const sixAmount = purchaseTxData.six_amount
    const userId = purchaseTxData.user_id
    const userRef = userCol.doc(userId)
    return tx.get(userRef).then(userDoc => {
      const userData = userDoc.data()
      const totalSix = (userData.total_six || 0)
      const newTotalSix = totalSix + sixAmount
      return Promise.all([
        tx.update(userRef, {total_six: newTotalSix})
      ])
    })
  })
}

function receivedDeposit (event, functions, fireStore) {
  const mailTransport = nodemailer.createTransport({
    host: functions.config().email.host,
    port: functions.config().email.port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: functions.config().email.user, // generated ethereal user
      pass: functions.config().email.password // generated ethereal password
    }
  })
  let purchaseData = event.data.data()
  return fireStore.collection('users').doc(purchaseData.user_id).get().then((user) => {
    user = user.data()
    const mailOptions = {
      from: functions.config().email.from,
      to: user.email
    }
    mailOptions.subject = 'SIX.network: Your deposit has been successfully received'
    let currency
    switch (purchaseData.type) {
      case 'eth':
        currency = 'Ethereum'
        break
      case 'xlm':
        currency = 'Stellar lumens'
        break
      default:
    }
    let time = new Date(purchaseData.time)
    let date = moment(time).format('DD-MM-YYYY') + ' ' + moment(time).format('HH:mm')
    let data = {
      name: user.first_name,
      lastname: user.last_name,
      address: purchaseData.from,
      currency: currency,
      native_amount: purchaseData.native_amount,
      type: purchaseData.type.toUpperCase(),
      tid: event.data.id.split("_")[0],
      time: date
    }
    mailOptions.html = emailTemplate.received_deposit(data)
    console.log(data)
    return mailTransport.sendMail(mailOptions)
  })
}
