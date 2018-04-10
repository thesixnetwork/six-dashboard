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
      'name': 'presaleBonus',
      'module': events.onCreate(event => presaleBonus(event, fireStore))
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

function presaleBonus (event, fireStore) {
  const purchaseTxData = event.data.data()
  const txId = event.params.txId
  const presaleCol = fireStore.collection('presale')
  return fireStore.runTransaction(tx => {
    const presaleRef = presaleCol.doc('supply')
    const purchasedPresaleRef = presaleRef.collection('purchased_presale_tx')
    return tx.get(presaleRef).then(presaleDoc => {
      const supplyInfo = presaleDoc.data()
      if (supplyInfo.total_presale_six >= supplyInfo.limit_presale_six) {
        return Promise.resolve('Presale is soldout!')
      }
      const latestReceivedSix = supplyInfo.total_presale_six + purchaseTxData.six_amount
      const userPurchasedPresaleRef = purchasedPresaleRef.doc(purchaseTxData.user_id)
      const bonus = purchaseTxData.six_amount * (supplyInfo.bonus_times || 0.06)
      return Promise.all([
        tx.update(presaleRef, {total_presale_six: latestReceivedSix}),
        tx.set(userPurchasedPresaleRef,
          {[txId]: { tx_id: txId,
            user_id: purchaseTxData.user_id,
            original_six: purchaseTxData.six_amount,
            bonus,
            total: bonus + purchaseTxData.six_amount }
          }, {merge: true})
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
