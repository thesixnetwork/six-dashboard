const admin = require('firebase-admin')
const functions = require('firebase-functions')
const request = require('request-promise')
const moment = require('moment-timezone')
const nodemailer = require("nodemailer")
const cors = require('cors')({origin: true})
const regeneratorRuntime = require("regenerator-runtime")

admin.initializeApp(functions.config().firebase)

const EthereumService = require('./service-ethereum')
const stellarService = require('./stellar-service')

const fireStore = admin.firestore()

require('./initialFireStoreData')(fireStore)

const account = {
  user: "apikey",
  pass: "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"
};

const mailTransport = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: account.user, // generated ethereal user
    pass: account.pass // generated ethereal password
  }
});

const triggers = require('./trigger')(functions, fireStore)
for (let trigger of triggers) {
  exports[trigger.name] = trigger.module
}

const userModels = require('./model/user')(functions, fireStore)
for (let trigger of userModels) {
  exports[trigger.name] = trigger.module
}

const getBasePriceURI = (coin) => `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=USD`

exports.incrementTotalAsset = functions.firestore.document('/purchase_txs/{txId}')
  .onCreate(event => {
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
  })

function generatePhoneVerificationCode (phoneNumber) {
  let refCode = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5).toUpperCase()
  let code = Math.random().toString().substr(2, 6)
  let validUntil = Math.round((new Date()).getTime() / 1000) + 180
  var http = require('https')
  var options = {
    'method': 'POST',
    'hostname': 'xisth3qe4e.execute-api.ap-southeast-1.amazonaws.com',
    'port': null,
    'path': '/production/sms',
    'headers': {
      'content-type': 'application/x-www-form-urlencoded',
      'cache-control': 'no-cache'
    }
  }

  var req = http.request(options, res => {
    var chunks = []

    res.on('data', chunk => {
      chunks.push(chunk)
    })

    res.on('end', () => {
      var body = Buffer.concat(chunks)
      console.log(body.toString())
    })
  })
  req.write('{"message": "Your code is ' + code + ' (Ref: ' + refCode + ')", "phone_number": "' + phoneNumber + '"}')
  req.end()
  let ref = admin.firestore().collection('phone-verifications')
  return ref.doc(phoneNumber).set({ ref_code: refCode, code: code, valid_until: validUntil }).then(() => {
    return { success: true, refCode: refCode, validUntil: validUntil }
  }).catch(err => {
    return { success: false, message: err.message }
  })
}

exports.phoneVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let phoneNumber = data.phone_number
  return ref.doc(phoneNumber).get().then(doc => {
    if (doc.exists) {
      if (doc.data().is_verified === true) {
        return { success: false, error_message: 'Phone number has already been used' }
      } else {
        return generatePhoneVerificationCode(phoneNumber).then(data => {
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
      return generatePhoneVerificationCode(phoneNumber).then(data => {
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
})

exports.phoneVerificationSubmit = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let userRef = admin.firestore().collection('users')
  let phoneNumber = data.phone_number
  let country = data.country
  let refCode = data.ref_code
  let code = data.code
  const uid = context.auth.uid
  return ref.doc(phoneNumber).get().then(doc => {
    if (doc.exists) {
      if (doc.data().is_verified === true) {
        return { success: false, error_message: 'Phone number has already been used' }
      } else {
        if (doc.data().valid_until > Math.round((new Date()).getTime() / 1000)) {
          if (doc.data().ref_code === refCode && doc.data().code === code) {
            let batch = admin.firestore().batch()
            batch.set(ref.doc(phoneNumber), {is_verified: true})
            batch.update(userRef.doc(uid), {'phone_number': phoneNumber, 'phone_verified': true, 'country': country})
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
})

exports.updateETHWallet = functions.https.onCall((data, context) => {
  const uid = context.auth.uid
  const eth_address = data.eth_address
  const ref = admin.firestore().collection('user-eth-wallets')
  const userRef = admin.firestore().collection('users')
  if (eth_address !== undefined && eth_address !== null) {
    return ref.doc(eth_address).get().then(doc => {
      if (doc.exists) {
        return { success: false, error_message: 'ETH address have been used' }
      } else {
        let batch = admin.firestore().batch()
        batch.set(ref.doc(eth_address), {uid: uid})
        batch.update(userRef.doc(uid), {'eth_address': eth_address, 'submit_wallet': true})
        return batch.commit().then(() => {
          return { success: true }
        }).catch(err => {
          return { success: false, error_message: err.message }
        })
      }
    })
  } else {
    return { success: false, error_message: 'ETH address could not be blank' }
  }
})

exports.initializeUserDoc = functions.auth.user().onCreate((event) => {
  const user = event.data
  const email = user.email
  let ref = admin.firestore().collection('users').doc(user.uid)
  return ref.set({ email: email }, { merge: true }).then(() => {
    return true
  })
})

function getTime () {
  const time = new Date()

  if (time.getMinutes > 55) {
    time.setHours(time.getHours() + 1)
  }

  time.setMinutes(0, 0, 0)

  const timeString = moment.tz(time, 'Asia/Bangkok').toString()

  return {
    unix: time.getTime(),
    string: timeString
  }
}

exports.hourly_xlm = functions.pubsub.topic('hourly-xlm').onPublish((event) => {
  const baseToken = 'xlm'
  return handleHourlyEvent(event, baseToken)
})

exports.hourly_eth = functions.pubsub.topic('hourly-eth').onPublish((event) => {
  const baseToken = 'eth'
  return handleHourlyEvent(event, baseToken)
})

exports.hourly_btc = functions.pubsub.topic('hourly-btc').onPublish((event) => {
  const baseToken = 'btc'
  return handleHourlyEvent(event, baseToken)
})

function handleHourlyEvent (event, baseToken) {
  const time = getTime()
  const uri = getBasePriceURI(baseToken.toUpperCase())

  return request({
    uri,
    method: 'GET',
    json: true
  })
    .then((body) => {
      return updateHourlyPrice(body, baseToken, time)
    })
}

function updateHourlyPrice (body, baseToken, time) {
  const price = body.USD / 0.1
  return fireStore
    .collection(`${baseToken}_prices`)
    .doc(time.unix.toString())
    .set({
      time: time.unix,
      price: body.USD,
      [`six_per_${baseToken}`]: price,
      time_string: time.string
    })
}

exports.monitorETH = functions.pubsub.topic('monitor-eth').onPublish(() => Promise.resolve(EthereumService.monitor()))

exports.monitorXLM = functions.pubsub.topic('monitor-xlm').onPublish(stellarService)

exports.logsUserTable = functions.firestore.document('users/{userId}').onWrite((event) => {
  const document = event.data.exists ? event.data.data() : null;
  const timestamp = Date.now()
  const oldDocument = event.data.previous.data();
  return admin.database().ref(`logs/${timestamp}`).set({document, oldDocument})
})

function genKycReadyEmail ({ email }) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: '"SIX Network" <noreply@six.network>',
      to: email,
      subject: "SIX.network: Pre-ICO is now open for contribution ",
      html: `
      <body id="ac-designer" class="body" style="font-family:Arial;line-height:1.1;margin-top:0px;margin-bottom:0px;margin-right:0px;margin-left:0px;background-color:#ffffff;width:100%;text-align:center;">
        <div class="divbody" style="margin-top:0px;margin-bottom:0px;margin-right:0px;margin-left:0px;outline-style:none;padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;color:#000000;font-family:arial;line-height:1.1;width:100%;background-color:#ffffff;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;text-align:center;">
          <table class="template-table" border="0" cellpadding="0" cellspacing="0" width="100%" align="left" style="font-size:13px;min-width:auto;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;">
            <tr>
              <td align="center" valign="top" width="100%">
                <table class="template-table" border="0" cellpadding="0" cellspacing="0" width="650" bgcolor="#ffffff" style="font-size:13px;min-width:auto;mso-table-lspace:0pt;mso-table-rspace:0pt;max-width:650px;">
                  <tr>
                    <td id="layout_table_8ec95b1f4afbf007cff9c9f914a162067c7ba113" valign="top" align="center" width="650">
                      <table cellpadding="0" cellspacing="0" border="0" class="layout layout-table root-table" width="650" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                        <tr>
                          <td id="layout-row-margin105" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                              <tr id="layout-row105" class="layout layout-row widget _widget_spacer ">
                                <td id="layout-row-padding105" valign="top">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                    <tr>
                                      <td valign="top" height="30">
                                        <div class="spacer" style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;height:30px;">
                                          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                            <tbody>
                                              <tr>
                                                <td class="spacer-body" valign="top" height="30" width="650"> </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td id="layout-row-margin107" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                              <tr id="layout-row107" class="layout layout-row widget _widget_picture " align="center">
                                <td id="layout-row-padding107" valign="top">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                    <tr>
                                      <td class="image-td" align="center" valign="top" width="650">
                                        <img src="https://six.network/images/logo/six-logo.png" alt="" width="296" style="display:block;border-style:none;outline-style:none;width:120px;opacity:1;max-width:100%;">
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td id="layout-row-margin108" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                              <tr id="layout-row108" class="layout layout-row widget _widget_break ">
                                <td id="layout-row-padding108" valign="top" style="line-height:0;mso-line-height-rule:exactly;">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;line-height:0;mso-line-height-rule:exactly;">
                                    <tr>
                                      <td height="10" style="line-height:0;mso-line-height-rule:exactly;"></td>
                                    </tr>
                                    <tr>
                                      <td align="center" height="1" width="650" style="line-height:0;mso-line-height-rule:exactly;">
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" height="1" width="650" style="font-size:13px;min-width:auto!important;mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;line-height:0;mso-line-height-rule:exactly;width:100%;max-width:100%;">
                                          <tr>
                                            <td class="break-line" bgcolor="#000000" height="1" width="650" style="line-height:1px;mso-line-height-rule:exactly;height:1px;width:650px;background-color:#000000;">
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td height="10" style="line-height:0;mso-line-height-rule:exactly;"></td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
      
                        <tr>
                          <td id="layout-row-margin109" valign="top" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:initial !important;">
                              <tr id="layout-row109" class="layout layout-row widget _widget_text style109" style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                                <td id="layout-row-padding109" valign="top" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                    <tr>
                                      <td id="text_div99" class="td_text td_block" valign="top" align="left" style="color:inherit;font-size:12px;font-weight:inherit;line-height:1;text-decoration:inherit;font-family:Arial;">
                                        <div style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-size:15px;">
                                          <span class="" style="color:inherit;font-size:15px;font-weight:inherit;line-height:inherit;text-decoration:inherit;">
                                            <h2>Pre-ICO is now open for contribution !</h2>
                                            <p>We have already opened a pre-ICO. You can login with your registered username and password
                                              to contribute.</p>
                                            <p>Please note that, the pre-ICO 6% bonus is first come first serve and
                                              <u>very limited.</u>
                                            </p>
                                            <p>
                                              Proceed to contribute:
                                              <a href="https://ico.six.network">https://ico.six.network</a>
                                              <br> How to buy:
                                              <a href="https://six.network/faq.html#howtobuy">https://six.network/faq.html#howtobuy</a>
                                            </p>
                                            <p>Best Regards,
                                              <br>SIX.network team</p>
                                          </span>
                                          <br>
                                          <div style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;text-align:center;">
                                            <span style="color:#000000;font-size:inherit;font-weight:400;line-height:inherit;text-decoration:inherit;font-family:arial;text-align:inherit;">Follow us</span>
                                            <span class="" style="color:#000000;font-size:inherit;font-weight:400;line-height:inherit;text-decoration:inherit;font-family:arial;text-align:inherit;"></span>
                                            <span style="color:#000000;font-size:inherit;font-weight:400;line-height:inherit;text-decoration:inherit;font-family:arial;text-align:inherit;">
                                            :</span>
                                          </div>
      
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td id="layout-row-margin110" valign="top" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:initial !important;">
                              <tr id="layout-row110" class="layout layout-row widget _widget_social style110">
                                <td id="layout-row-padding110" valign="top" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                    <tr>
                                      <td>
                                        <table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                          <tr>
                                            <td width="650" align="left">
                                              <center style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-size:0px;">
                                                <table class="_ac_social_table" cellspacing="0" cellpadding="0" align="center" style="font-size:0;min-width:auto!important;mso-table-lspace:0pt;mso-table-rspace:0pt;margin-top:auto !important;margin-bottom:auto !important;margin-right:auto !important;margin-left:auto !important;display:inline-block!important;text-align:center!important;">
                                                  <tr>
                                                    <td align="center" valign="middle" width="34" style="display:inline-block!important;font-size:0;width:34px!important;">
                                                      <div class="__ac_social_icons" style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                                                        <a href="https://www.facebook.com/thesixnetwork/" id="facebook" class="__ac_social_icon_link"
                                                          style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;color:#045fb4;">
                                                          <img src="http://sixnetwork.img-us3.com/_social_/flat-color-poly-facebook.png"
                                                            border="0" width="34" style="display:block;border-style:none;">
                                                        </a>
                                                      </div>
                                                    </td>
                                                    <td width="10" style="display:inline-block!important;font-size:0;width:10px!important;"> </td>
                                                    <td align="center" valign="middle" width="34" style="display:inline-block!important;font-size:0;width:34px!important;">
                                                      <div class="__ac_social_icons" style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                                                        <a href="https://twitter.com/theSIXnetwork" id="twitter" class="__ac_social_icon_link"
                                                          style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;color:#045fb4;">
                                                          <img src="http://sixnetwork.img-us3.com/_social_/flat-color-poly-twitter.png"
                                                            border="0" width="34" style="display:block;border-style:none;">
                                                        </a>
                                                      </div>
                                                    </td>
                                                    <td width="10" style="display:inline-block!important;font-size:0;width:10px!important;"> </td>
                                                    <td align="center" valign="middle" width="34" style="display:inline-block!important;font-size:0;width:34px!important;">
                                                      <div class="__ac_social_icons" style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                                                        <a href="https://six.network" id="website" class="__ac_social_icon_link"
                                                          style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;color:#045fb4;">
                                                          <img src="http://sixnetwork.img-us3.com/_social_/flat-color-poly-website.png"
                                                            border="0" width="34" style="display:block;border-style:none;">
                                                        </a>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </center>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td id="layout-row-margin104" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                              <tr id="layout-row104" class="layout layout-row widget _widget_text " style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                                <td id="layout-row-padding104" valign="top">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;line-height:0;mso-line-height-rule:exactly;">
                                    <tbody>
                                      <tr>
                                        <td height="10" style="line-height:0;mso-line-height-rule:exactly;"></td>
                                      </tr>
                                      <tr>
                                        <td align="center" height="1" width="650" style="line-height:0;mso-line-height-rule:exactly;">
                                          <table align="center" border="0" cellpadding="0" cellspacing="0" height="1" width="650" style="font-size:13px;min-width:auto!important;mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;line-height:0;mso-line-height-rule:exactly;width:100%;max-width:100%;">
                                            <tbody>
                                              <tr>
                                                <td class="break-line" bgcolor="#000000" height="1" width="650" style="line-height:1px;mso-line-height-rule:exactly;height:1px;width:650px;background-color:#000000;">
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td height="10" style="line-height:0;mso-line-height-rule:exactly;"></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size:13px;min-width:100%;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                                    <tr>
                                      <td id="text_div94" class="td_text td_block" valign="top" align="left" style="line-height:1.4;color:inherit;font-size:12px;font-weight:inherit;text-decoration:inherit;font-family:Arial;mso-line-height-rule:exactly;">
                                        <div data-line-height="1.4" style="line-height:1.4;margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-size:12px;mso-line-height-rule:exactly;">
                                          <div style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                                            <p style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;outline-style:none;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;color:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;text-decoration:inherit;">This email was sent to you by SIX.network because you registered for ICO contribution.
                                              If you don't know this source, please ignore this email..</p>
                                          </div>
                                        </div>
                                        <!--[if (gte mso 12)&(lte mso 15) ]>
                                                        <style data-ac-keep="true" data-ac-inline="false"> #text_div94, #text_div94 div { line-height: 140% !important !important; } !important;</style>
                                                        <![endif]-->
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
    `
    };
    resolve(mailOptions)
  })
}


function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.sendKycReadyEmail = functions.https.onRequest(function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
    var _req$body, emails, password, finish, fail, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, email, mailOptions, send;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            cors(req, res, function () {});
            console.log(req.body, 'req.body....');
            _req$body = req.body, emails = _req$body.emails, password = _req$body.password;
            finish = [];
            fail = [];

            if (!(password === 'ineedtosendemail')) {
              _context.next = 40;
              break;
            }

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 9;
            _iterator = emails[Symbol.iterator]();

          case 11:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 23;
              break;
            }

            email = _step.value;
            _context.next = 15;
            return genKycReadyEmail({ email: email });

          case 15:
            mailOptions = _context.sent;
            _context.next = 18;
            return mailTransport.sendMail(mailOptions);

          case 18:
            send = _context.sent;

            finish.push(email);

          case 20:
            _iteratorNormalCompletion = true;
            _context.next = 11;
            break;

          case 23:
            _context.next = 29;
            break;

          case 25:
            _context.prev = 25;
            _context.t0 = _context['catch'](9);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 29:
            _context.prev = 29;
            _context.prev = 30;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(29);

          case 37:
            return _context.abrupt('return', res.json({ finish: finish, fail: fail, success: true }));

          case 40:
            return _context.abrupt('return', res.status(400).json(new Error('Password not match')));

          case 41:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[9, 25, 29, 37], [30,, 32, 36]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

// Upper function convert from this function should not remove.
// exports.sendKycReadyEmail = functions.https.onRequest(async (req, res) => {
//   cors(req, res, () => {});
//   console.log(req.body, 'req.body....')
//   const { emails, password } = req.body
//   let finish = [];
//   let fail = []
//   if ( password === 'ineedtosendemail') {
//     for ( let email of emails ) {
//       const mailOptions = await genKycReadyEmail({ email })
//       const send = await mailTransport.sendMail(mailOptions)
// 	  finish.push(email)
//     }
//     return res.json({ finish, fail, success: true })
//   } else {
//     return res.status(400).json(new Error('Password not match'))
//   }
// })

exports.autoSendKycReadyEmail = functions.firestore.document('/users/{userId}').onUpdate(event => {
  console.log(event.data.kyc_status)
  const document = event.data.exists ? event.data.data() : null;
  const oldDocument = event.data.previous.data();
  if (document.kyc_status === 'approved' && !oldDocument.kyc_status !== 'approved') {
    console.log(`Send pro-ico email to : ${document.email}`)
    return genKycReadyEmail({ email: document.email }).then(mailOptions => {
      return mailTransport.sendMail(mailOptions)
        .then(result => {
          console.log(result, 'result')
          return result
        })
        .catch(err => {
          console.log(err)
          return err
        })
    })
  }
})