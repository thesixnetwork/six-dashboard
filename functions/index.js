const functions = require('firebase-functions')
const axios = require('axios')
const Querystring = require('query-string')
const API_KEY = functions.config().campaign.api_key
const BASE_URL = functions.config().campaign.base_url

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.sendCampaignEmail = functions.firestore.document('/users/{uid}').onCreate(event => {
  const snapshot = event.data
  const data = snapshot.data()
  const { email, firstName, lastName, phone } = data
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
})
