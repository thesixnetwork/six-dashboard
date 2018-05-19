const emailTemplate = require('./static')
const Querystring = require('query-string')
const nodemailer = require('nodemailer')
const axios = require('axios')
const path = '/users/{uid}'
const http = require('http')
const FormData = require('form-data')
const ArtemisAPI = require('../model/artemisAPI')
module.exports = function (admin, functions, fireStore) {
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
    'module': events.onUpdate(event => checkKYCStatus(event, admin, functions, fireStore))
  }, {
    'name': 'checkAddressETH',
    'module': events.onUpdate(event => checkAddressETH(event, functions, fireStore))
  }, {
    'name': 'checkKycAstemis',
    'module': functions.pubsub.topic('check-kyc-astemis').onPublish(event => checkKycAstemis(admin, functions, fireStore))
  }
  ]
}

function checkKYCStatus (event, admin, functions, fireStore) {
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
    // kycArtemis(admin, functions, userData)
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
    } else if (userData.reject_type === 'other') {
      mailOptions.html = emailTemplate.rejected_other({note_text: userData.reject_note_extend})
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
      if (totalETH > 15000) return Promise.resolve('Presale is soldout.')
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

function checkAddressETH (event, functions, fireStore) {
  const uid = event.params.uid
  const userData = event.data.data()
  const previousUserData = event.data.previous.data()
  // console.log(userData.eth_address)
  // console.log(previousUserData.eth_address)
  if (userData.eth_address !== previousUserData.eth_address) {
    return http.get(`http://api.etherscan.io/api?module=account&action=txlist&address=${userData.eth_address}&startblock=0&endblock=99999999&sort=asc&apikey=EBYZ1URIDI4E7JWZNW4NVPPDISMMEQHS9S&offset=100&page=1`, function (response) {
      let finalData = ''
      response.on('data', function (data) {
        finalData += data.toString()
      })
      response.on('end', function () {
        const userRef = fireStore.collection('users').doc(uid)
        return fireStore.runTransaction(tx => tx.get(userRef).then(user => {
          if (finalData !== '') {
            let txs = JSON.parse(finalData)
            // console.log(txs)
            let suspiciousETH = true
            if (txs.result.length !== 100) {
              suspiciousETH = false
            }
            tx.update(userRef, {suspicious_eth: suspiciousETH})
          }
        }))
      })
    })
  } else {
    return Promise.resolve()
  }
}

function kycArtemis (admin, functions, userData) {
  let rejectNote = {
    need_more: `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.
  We would highly appreciate if you could resubmit the documents and/ or information through the link below.
  Thank you for your interest in our ICO.
  SIX.network`,
    restricted: `We highly appreciate that you took the time for the registration. After reviewing your submitted application materials, the KYC/AML result does not match with our requirements.
  We highly appreciate that you are interested in our ICO. Please do support us in the secondary market soon.
  Thank you for your interest in SIX.network and our ICO.
  SIX.network`,
    incorrect: `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.
  We would highly appreciate if you could resubmit the documents and/ or information through the link below.
  Thank you for your interest in our ICO.
  SIX.network`,
    photo_corrupted: `We appreciate that you took the time for the registration. However, we received incorrect or unclear information regarding your selfie picture.
  We would highly appreciate if you could resubmit your selfie through the link below.`,
    other: `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.
  Thank you for your interest in our ICO. `
  }

  if (typeof (userData.kyc_error_count) === 'undefined') {
    userData.kyc_error_count = 0
  }
  if (userData.kyc_status === 'pending' && userData.kyc_error_count < 3) {
    let artemis = new ArtemisAPI(functions.config().astemis.host, functions.config().astemis.app, functions.config().astemis.token)
    admin.database().ref(`/country/${userData.country}/`).on('value', function (snapshot) {
      let artemisData = {
        domain_name: functions.config().astemis.domain_name,
        rfrID: userData.uid,
        first_name: userData.first_name,
        last_name: userData.last_name,
        nationality: snapshot.val().nationality,
        country_of_residence: snapshot.val().country,
        ssic_code: 'UNKNOWN',
        ssoc_code: 'UNKNOWN',
        onboarding_mode: 'NON FACE-TO-FACE',
        payment_mode: 'VIRTUAL CURRENCY',
        product_service_complexity: 'COMPLEX',
        addresses: userData.address,
        identification_number: userData.citizen_id,
        telephone_numbers: [
          userData.phone_number
        ],
        emails: [
          userData.email
        ]
      }
      artemis.getIndividualCustomer({cust_rfr_id: userData.uid}).then(data => {
        console.log('Update Profile')
        artemisData.cust_rfr_id = userData.uid
        delete artemisData['rfrID']
        return artemis.updateIndividualCustomer(artemisData)
      }).catch(err => {
        console.log(err.response.data.errors)
        console.log('Create Profile')
        return artemis.createIndividualCustomer(artemisData)
      }).then(astermisUser => {
        console.log('Upload Doc')
        let photoId = new FormData()
        photoId.append('document_type', 'PASSPORT')
        photoId.append('authenticity', 'SIGHTED ORIGINAL')
        photoId.append('cust_rfr_id', userData.uid)
        let astemisPhoto = artemis.createIndividualCustomerDoc(userData.pic4, photoId)
        let selfie = new FormData()
        selfie.append('document_type', 'SELFIE')
        selfie.append('authenticity', 'SIGHTED ORIGINAL')
        selfie.append('cust_rfr_id', userData.uid)
        let astemisSelfie = artemis.createIndividualCustomerDoc(userData.pic2, selfie)
        return Promise.all([astemisPhoto, astemisSelfie])
      }).then(values => {
        console.log('Check Face')
        let [astemisPhoto, astemisSelfie] = values
        console.log(astemisPhoto.data.id)
        console.log(astemisSelfie.data.id)
        let faceId = {
          cust_rfr_id: userData.uid,
          source_doc_id: astemisPhoto.data.id,
          target_doc_id: astemisSelfie.data.id
        }
        return artemis.checkIndividualFaceCustomer(faceId)
      }).then(face => {
        console.log('Create Invidividual Report')
        if (typeof (userData.kyc_error_count) === 'undefined') {
          userData.kyc_error_count = 0
        }
        let updateData = {
          kyc_status: 'rejected',
          reject_type: 'photo_corrupted',
          updater: 'auto',
          update_time: Date.now(),
          kyc_error_count: userData.kyc_error_count + 1,
          reject_note: rejectNote.photo_corrupted
        }
        console.log(face.data.compare_result)
        switch (face.data.compare_result) {
          case 'MATCH':
            return artemis.createIndividualCustomerReport({cust_rfr_id: userData.uid}).then(report => {
              if (report.data.approval_status === 'CLEARED') {
                updateData = {
                  kyc_status: 'approved',
                  updater: 'auto',
                  update_time: Date.now()
                }
                return admin.firestore().collection('users').doc(userData.uid).update(updateData)
              }
            })
          case 'NO MATCH':
            return admin.firestore().collection('users').doc(userData.uid).update(updateData)
          case 'UNCERTAIN':
            return admin.firestore().collection('users').doc(userData.uid).update(updateData)
        }
      }).catch(err => {
        if (typeof (userData.kyc_error_count) === 'undefined') {
          userData.kyc_error_count = 0
        }
        let updateData = {
          kyc_status: 'rejected',
          reject_type: 'photo_corrupted',
          updater: 'auto',
          update_time: Date.now(),
          kyc_error_count: userData.kyc_error_count + 1,
          reject_note: rejectNote.photo_corrupted
        }
        switch (err.response.data.compare_result) {
          case 'UNCERTAIN':
            return admin.firestore().collection('users').doc(userData.uid).update(updateData)
        }
      })
    }, function (errorObject) {
      console.log('The read failed: ' + errorObject.code)
    })
  }
}

function checkKycAstemis (admin, functions, fireStore) {
  let artemis = new ArtemisAPI(functions.config().astemis.host, functions.config().astemis.app, functions.config().astemis.token)
  fireStore.collection('users').where('kyc_error_count', '<', '3').where('kyc_status', '==', 'pending').get().then(users => {
    users.forEach(user => {
      let userData = user.data()
      artemis.checkIndividualCustomer({rfrID: userData.uid}).then(report => {
        if (report.data.approval_status === 'CLEARED') {
          let updateData = {
            kyc_status: 'approved',
            updater: 'auto',
            update_time: Date.now()
          }
          return admin.firestore().collection('users').doc(userData.uid).update(updateData)
        }
      })
    })
  })
}
