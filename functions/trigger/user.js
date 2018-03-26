const Querystring = require('query-string')
const axios = require('axios')
const path = '/users/{uid}'

module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [{
    'name': 'sendCampaignEmail',
    'module': events.onCreate(event => sendCampaignEmail(event, functions, fireStore))
  }, {
    'name': 'logNewUser',
    'module': events.onCreate(event => Promise.resolve(console.log(event.data.data(), event.params.uid)))
  }, {
    'name': 'addUserNumber',
    'module': events.onCreate(event => addUserNumber(event, functions, fireStore))
  }, {
    'name': 'checkPresaleDiscount',
    'module': events.onUpdate(event => checkPresaleDiscount(event, functions, fireStore))
  }]
}

function checkPresaleDiscount (event, functions, fireStore) {
  const uid = event.params.uid
  const userData = event.data.data()
  const presaleUserRef = fireStore.collection('presale').doc('supply').collection('reserve').doc(uid)
  const totalEthRef = fireStore.collection('presale').doc('supply')
  if (userData.kyc_status !== 'approved' || !userData.reserve_eth) return Promise.resolve() // do nothing
  return fireStore.runTransaction(tx => tx.get(presaleUserRef).then(userReserve => {
    if (userReserve.exists) {
      return Promise.reject(new Error(`uid:${uid} already reserved`))
    }
    return tx.get(totalEthRef).then(doc => {
      const totalETH = doc.data().total_eth
      const latestTotalETH = totalETH + (userData.reserve_eth || 0)
      if (latestTotalETH > 15000) return Promise.reject(new Error('Presale is soldout.'))
      return Promise.all([tx.update(totalEthRef, {total_eth: latestTotalETH}), tx.set(presaleUserRef, {total_eth: latestTotalETH})])
    })
  }))
}

function addUserNumber (event, functions, fireStore) {
  const uid = event.params.uid
  const userRef = fireStore.collection('user').doc(uid)
  const userNumberRef = fireStore.collection('generator').doc('user')
  return fireStore.runTransaction(tx => tx.get(userNumberRef).then(doc => {
    if (!doc.exists) {
      return Promise.reject(new Error('user number generator path does not exists.'))
    }
    const newLatestNumber = doc.data().latest_number + 1
    const memo = JSON.stringify({n: newLatestNumber})
    return Promise.all([tx.update(userRef, {user_number: newLatestNumber, memo, uid}), tx.update(userNumberRef, {latest_number: newLatestNumber})])
  })
  )
}

function sendCampaignEmail (event, functions, fireStore) {
  const snapshot = event.data
  const data = snapshot.data()
  const { email, firstName, lastName, phone } = data
  const API_KEY = functions.config().campaign.api_key
  const BASE_URL = functions.config().campaign.base_url
  const postObj = Querystring.stringify({
    'email': email,
    'fist_name': firstName,
    'last_name': lastName,
    'phone': phone
  })
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
