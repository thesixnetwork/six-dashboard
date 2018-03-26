const functions = require('firebase-functions')
const axios = require('axios')
const Querystring = require('query-string')
const API_KEY = functions.config().campaign.api_key
const BASE_URL = functions.config().campaign.base_url
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

function generatePhoneVerificationCode(phone_number) {
  let refCode = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5).toUpperCase()
  let code = Math.random().toString().substr(2, 6)
  let validUntil = Math.round((new Date()).getTime() / 1000)+180
  var http = require("https");
  var options = {
    "method": "POST",
    "hostname": "tm3swoarp5.execute-api.ap-southeast-1.amazonaws.com",
    "port": null,
    "path": "/production/sms",
    "headers": {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache",
    }
  };

  var req = http.request(options, res => {
    var chunks = [];

    res.on("data", chunk => {
      chunks.push(chunk);
    });

    res.on("end", () => {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });
  req.write("{\"message\": \"Your code is "+ code +" (Ref: "+refCode+")\", \"phone_number\": \""+phone_number+"\"}");
  req.end();
  let ref = admin.firestore().collection('phone-verifications')
  return ref.doc(phone_number).set({ ref_code: refCode, code: code, valid_until: validUntil }).then(() => {
    return { success: true, refCode: refCode, validUntil: validUntil }
  }).catch(err => {
    return { success: false, message: err.message }
  })
}

exports.phoneVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let phone_number = data.phone_number
  return ref.doc(phone_number).get().then(doc => {
    if (doc.exists) {
      if (doc.data().is_verified === true) {
        return { success: false, error_message: 'Phone number has already been used' }
      } else {
        return generatePhoneVerificationCode(phone_number).then(data => {
          if (data.success === true) {
            let refCode = data.refCode
            let validUntil = data.validUntil
            return { success: true, ref_code: refCode, valid_until: validUntil }
          } else {
            return { success: false, error_message: 'Unexpected error, please try again' }
          }
        }).catch(() => {
          return { success: false, error_message: 'Unexpected error, please try again' }
        })
      }
    } else {
      return generatePhoneVerificationCode(phone_number).then(data => {
        if (data.success === true) {
          let refCode = data.refCode
          let validUntil = data.validUntil
          return { success: true, ref_code: refCode, valid_until: validUntil }
        } else {
          return { success: false, error_message: 'Unexpected error, please try again' }
        }
      }).catch(() => {
        return { success: false, error_message: 'Unexpected error, please try again' }
      })
    }
  }).catch(err => {
    console.log(err)
    return { success: false, error_message: err.message }
  })
});

exports.phoneVerificationSubmit = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let userRef = admin.firestore().collection('users')
  let phone_number = data.phone_number
  let country = data.country
  let ref_code = data.ref_code
  let code = data.code
  const uid = context.auth.uid
  return ref.doc(phone_number).get().then(doc => {
    if (doc.exists) {
      if (doc.data().is_verified === true) {
        return { success: false, error_message: 'Phone number has already been used' }
      } else {
        if (doc.data().valid_until > Math.round((new Date()).getTime() / 1000)) {
          if (doc.data().ref_code === ref_code && doc.data().code === code) {
            let batch = admin.firestore().batch()
            batch.set(ref.doc(phone_number), {is_verified: true})
            batch.update(userRef.doc(uid), {"phone_number": phone_number, "phone_verified": true, 'country': country})
            return batch.commit().then(() => {
              return { success: true }
            }).catch(err => {
              return { success: false, error_message: err.message }
            })
          } else {
            return { success: false, error_message: 'Invalid verification code' }
          }
        } else {
          return { success: false, error_message: 'Verification session expired' }
        }
      }
    } else {
      return { success: false, error_message: 'Unexpected error, please try again' }
    }
  }).catch(err => {
    console.log(err)
    return { success: false, error_message: err.message }
  })
});

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
