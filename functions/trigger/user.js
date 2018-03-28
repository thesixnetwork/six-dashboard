const emailTemplate = require('./static')
const Querystring = require('query-string')
const nodemailer = require('nodemailer')
const axios = require('axios')
const path = '/users/{uid}'

module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [{
    'name': 'sendCampaignEmailRegistration',
    'module': events.onCreate(event => sendCampaignEmailRegistration(event, functions, fireStore))
  }, {
    'name': 'logNewUser',
    'module': events.onCreate(event => Promise.resolve(console.log(event.data.data(), event.params.uid)))
  }, {
    'name': 'addUserNumber',
    'module': events.onCreate(event => addUserNumber(event, functions, fireStore))
  }, {
    'name': 'checkPresaleDiscount',
    'module': events.onUpdate(event => checkPresaleDiscount(event, functions, fireStore))
  }, {
    'name': 'checkKYCStatus',
    'module': events.onUpdate(event => checkKYCStatus(event, functions, fireStore))
  }]
}

function checkKYCStatus (event, functions, fireStore) {
  const mailTransport = nodemailer.createTransport({
    host: functions.config().email.host,
    port: functions.config().email.port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: functions.config().email.user, // generated ethereal user
      pass: functions.config().email.password // generated ethereal password
    }
  })
  const userData = event.data.data()
  const previousUserData = event.data.previous.data()
  const mailOptions = {
    from: functions.config().email.from,
    to: userData.email
  }
  if (userData.kyc_status === 'pending' && previousUserData.kyc_status !== 'pending') {
    mailOptions.subject = 'KYC pending for approval.'
    mailOptions.html = emailTemplate.pending({name: userData.first_name, lastname: userData.last_name})
  } else if (userData.kyc_status === 'approved' && previousUserData.kyc_status !== 'approved') {
    mailOptions.subject = 'KYC already approved.'
    mailOptions.html = emailTemplate.approved({})
    setNullToRejectType(event, fireStore)
    sendCampaignEmailApprove(event, functions)
  } else if (userData.kyc_status === 'rejected' && previousUserData.kyc_status !== 'rejected') {
    mailOptions.subject = 'KYC rejected.'
    if (userData.reject_type === 'restricted') {
      mailOptions.html = emailTemplate.rejected_restricted({})
    } else if (userData.reject_type === 'photo_corrupted') {
      mailOptions.html = emailTemplate.rejected_photo_corrupted({})
    } else {
      mailOptions.html = emailTemplate.rejected_need_more({})
    }
  } else {
    return Promise.resolve() // do nothing
  }
  console.log(`Send Email to ${userData.email} kyc_status: ${userData.kyc_status}`)
  return mailTransport.sendMail(mailOptions)
}

function setNullToRejectType (event, fireStore) {
  const uid = event.params.uid
  const userData = event.data.data()
  if (userData.reject_type === null) {
    return Promise.resolve() // do nothing
  }
  const userRef = fireStore.collection('users').doc(uid)
  return fireStore.runTransaction(tx => tx.get(userRef).then(user => tx.update(userRef, {reject_type: null})))
}

function checkPresaleDiscount (event, functions, fireStore) {
  const uid = event.params.uid
  const userData = event.data.data()
  const previousUserData = event.data.previous.data()
  const estimate = (+userData.estimate || 0) // force estimate from string to number (default 0)
  if (userData.kyc_status !== 'approved' || previousUserData.kyc_status === 'approved' || estimate <= 0) return Promise.resolve() // do nothing
  const userRef = fireStore.collection('users').doc(uid)
  const presaleUserRef = fireStore.collection('presale').doc('supply').collection('reserve').doc(uid)
  const totalEthRef = fireStore.collection('presale').doc('supply')
  return fireStore.runTransaction(tx => tx.get(presaleUserRef).then(userReserve => {
    if (userReserve.exists) {
      return Promise.reject(new Error(`uid:${uid} already reserved`))
    }
    return tx.get(totalEthRef).then(doc => {
      const totalETH = doc.data().total_eth
      const latestTotalETH = totalETH + estimate
      if (totalETH > 15000) return Promise.reject(new Error('Presale is soldout.'))
      return Promise.all([tx.update(totalEthRef, {total_eth: latestTotalETH}), tx.set(presaleUserRef, {total_eth: estimate}), tx.update(userRef, {is_presale: true})])
    })
  }))
}

function addUserNumber (event, functions, fireStore) {
  const uid = event.params.uid
  const userRef = fireStore.collection('users').doc(uid)
  const userNumberRef = fireStore.collection('generator').doc('user')
  return fireStore.runTransaction(tx => tx.get(userNumberRef).then(doc => {
    if (!doc.exists) {
      return Promise.reject(new Error('user number generator path does not exists.'))
    }
    const newLatestNumber = doc.data().latest_number + 1
    const buf = Buffer.from(JSON.stringify({n: newLatestNumber}))
    const memo = '0x' + buf.toString('hex')
    return Promise.all([tx.update(userRef, {user_number: newLatestNumber, memo, uid}), tx.update(userNumberRef, {latest_number: newLatestNumber})])
  })
  )
}

function sendCampaignEmailRegistration (event, functions, fireStore) {
  const snapshot = event.data
  const data = snapshot.data()
  const { email, firstName, lastName, phone } = data
  const API_KEY = functions.config().campaign.api_key
  const BASE_URL = functions.config().campaign.base_url
  const regListId = functions.config().campaign.reg_list_id
  const regListIdParam = `p[${regListId}]`
  const param = {
    'email': email,
    'fist_name': firstName,
    'last_name': lastName,
    'phone': phone
  }
  param[regListIdParam] = regListId
  const postObj = Querystring.stringify(param, {arrayFormat: 'index'})
  console.log('postObj : ' + postObj)
  const url = `${BASE_URL}/admin/api.php?api_action=contact_add&api_key=${API_KEY}&api_output=json`
  return axios.post(url, postObj)
    .then(res => res.data)
    .then(data => {
      return console.log(data, 'res from activecampaign')
    })
    .catch(err => {
      return console.log(err, 'error send email')
    })
}

function sendCampaignEmailApprove (event, functions) {
  const snapshot = event.data
  const data = snapshot.data()
  const { email } = data
  const API_KEY = functions.config().campaign.api_key
  const BASE_URL = functions.config().campaign.base_url
  const approveListId = functions.config().campaign.approve_list_id
  const approveListIdParam = `p[${approveListId}]`
  const contactViewEmailUrl = `${BASE_URL}/admin/api.php?api_action=contact_view_email&api_key=${API_KEY}&api_output=json&email=${email}`
  axios.get(contactViewEmailUrl)
    .then(res => res.data)
    .then(data => {
      const contactId = data.id
      const contactEditURL = `${BASE_URL}/admin/api.php?api_action=contact_edit&api_key=${API_KEY}&api_output=json`
      const param = {
        'email': email,
        'id': contactId
      }
      param[approveListIdParam] = approveListId
      const postObj = Querystring.stringify(param, {arrayFormat: 'index'})
      axios.post(contactEditURL, postObj)
        .then(res => {
          const data = res.data
          return console.log(data, 'res from activecampaign')
        })
    })
}
