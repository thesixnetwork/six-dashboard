/*jshint esversion: 6 */
const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');
const Querystring = require('query-string');
const API_KEY = functions.config().compaign.api_key;
const BASE_URL = 'https://sixnetwork.api-us1.com';

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.sendCampaignEmail = functions.database.ref("/users/{uid}").onCreate(event => {
  const snapshot = event.data;
  const data = snapshot.val();
  const { email, firstName, lastName, phone } = data;
  const queryString = `email=${email}&first_name=${firstName}&last_name=${lastName}&phone=${phone}`;
  const postObj = Querystring.stringify({
    "email": email,
    "fist_name": firstName,
    "last_name": lastName,
    "phone": phone
  });
  const url = `${BASE_URL}/admin/api.php?api_action=contact_add&api_key=${API_KEY}&api_output=json`;
  return axios.post(url, postObj)
    .then(res => res.data)
    .then(data => {
      return console.log(data, 'res from activecampaign');
    })
    .catch(err => {
      return console.log(err, 'error send email');
    });
});
