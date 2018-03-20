const functions = require('firebase-functions');
const axios = require('axios')
const admin = require('firebase-admin')
const Querystring = require('query-string')

const BASE_URL = 'https://sixnetwork.api-us1.com'
const API_KEY = '3a2ccae1fc73e46759aa88291b3b7179282f77acf2e87fb77a26237a18b7335082a0b2d2'

exports.sendCampaignEmail = functions.database.ref("/users/{uid}").onCreate(event => {
  const snapshot = event.data
  const data = snapshot.val()
  const { email, firstName, lastName, phone } = data
  const queryString = `email=${email}&first_name=${firstName}&last_name=${lastName}&phone=${phone}`
  const postObj = Querystring.stringify({
    "email": email,
    "fist_name": firstName,
    "last_name": lastName,
    "phone": phone
  });
  const url = `${BASE_URL}/admin/api.php?api_action=contact_add&api_key=${API_KEY}&api_output=json`
  return axios.post(url, postObj)
    .then(res => res.data)
    .then(data => {
      console.log(data, 'res from activecampaign')
    })
    .catch(err => console.log(err, 'error send email'))
})