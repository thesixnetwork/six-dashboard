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
    'module': events.onCreate(event => console.log(event.data.data(), event.params.uid))
  }]
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
