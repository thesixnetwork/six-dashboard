const admin = require('firebase-admin')
const StellarSdk = require('stellar-sdk')
const functions = require('firebase-functions')
const request = require('request-promise')
const moment = require('moment-timezone')
const nodemailer = require('nodemailer')
const cors = require('cors')({ origin: true })
const regeneratorRuntime = require('regenerator-runtime')
const sgTransport = require('nodemailer-sendgrid-transport')
const axios = require('axios')

admin.initializeApp(functions.config().firebase)
const fireStore = admin.firestore()

exports.functions = functions
exports.fireStore = fireStore

const EthereumService = require('./service-ethereum')
const stellarService = require('./stellar-service')
const claimService = require('./claim-service')
const activecampaign_subscriber = require('./activecampaign_subscriber')

const handleCreateStellarAccount = claimService.handleCreateStellarAccount
const handleClaimSix = claimService.handleClaimSix
const claimSixByCreatePool = claimService.claimSixByCreatePool

require('./initialFireStoreData')(fireStore)

const SENDGRID_API_KEY = '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'

const sgOptions = {
  auth: {
    api_key: SENDGRID_API_KEY
  }
}

const mailTransport = nodemailer.createTransport(sgTransport(sgOptions))

const triggers = require('./trigger')(admin, functions, fireStore)
for (let trigger of triggers) {
  exports[trigger.name] = trigger.module
}

const userModels = require('./model/user')(functions, fireStore)
for (let trigger of userModels) {
  exports[trigger.name] = trigger.module
}

const getBasePriceURI = coin =>
  `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=USD`

exports.incrementTotalAsset = functions.firestore
  .document('/purchase_txs/{txId}')
  .onCreate(event => {
    const data = event.data.data()
    console.log(
      'Create Transaction:',
      event.params.txId,
      data.type,
      data.native_amount
    )
    const assetCol = fireStore.collection('total_asset')
    return fireStore.runTransaction(tx =>
      Promise.all(
        [
          { type: data.type, key: 'native_amount' },
          { type: 'usd', key: 'total_usd_price' },
          { type: 'six', key: 'six_amount' }
        ].map(asset => {
          const ref = assetCol.doc(asset.type)
          return tx
            .get(ref)
            .then(assetDoc =>
              tx.update(ref, { total: assetDoc.data().total + data[asset.key] })
            )
        })
      )
    )
  })

const issuerKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.issuer_low_secret
)
const distKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.ico_distributor_secret
)

const secondaryClaimUrl = functions.config().secondary_signer.url + '/setPublicKey'

exports.claimOTPSubmit = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('users_claim')
  let claimId = String(data.claim_id)
  let refCode = data.ref_code
  let code = data.code
  const uid = context.auth.uid
  return ref
    .doc(uid)
    .collection('claim_period')
    .doc(String(claimId))
    .get()
    .then(doc => {
      if (doc.exists) {
        if (doc.data().claimed === true) {
          return {
            success: false,
            error_message: 'Claimed'
          }
        } else {
          if (
            doc.data().valid_until > Math.round(new Date().getTime() / 1000)
          ) {
            if (doc.data().ref_code === refCode && doc.data().code === code) {
              if (!issuerKey || !distKey) {
                return {
                  success: false,
                  error_message: 'not yet config stellar params'
                }
              }

              if (!uid || ((claimId !== undefined) && !String(claimId))) {
                return {
                  success: false,
                  error_message: 'Invalid Request'
                }
              }

              return claimSixByCreatePool(uid, claimId)
            } else {
              return {
                success: false,
                error_message: 'Invalid verification code'
              }
            }
          } else {
            return {
              success: false,
              error_message: 'Verification session expired'
            }
          }
        }
      } else {
        return {
          success: false,
          error_message: 'Unexpected error, please try again'
        }
      }
    })
    .catch(err => {
      console.log(err)
      return { success: false, error_message: err.message }
    })
})

exports.claimVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('users_claim')
  let userref = admin.firestore().collection('users')
  let user_id = context.auth.uid
  let claim_id = data.claim_id
  return userref
    .doc(user_id)
    .get()
    .then(doc => {
      return doc.data().phone_number
    }).then(phone_number => {
      return ref
        .doc(user_id)
        .collection('claim_period')
        .doc(String(claim_id))
        .get()
        .then(doc => {
          if (doc.exists) {
            if (doc.data().claimed === true) {
              return {
                success: false,
                error_message: 'Claimed'
              }
            } else {
              return generateClaimVerificationCode(user_id, claim_id, phone_number)
                .then(data => {
                  if (data.success === true) {
                    let refCode = data.refCode
                    let validUntil = data.validUntil
                    return {
                      success: true,
                      ref_code: refCode,
                      valid_until: validUntil,
                      phone_number: phone_number
                    }
                  } else {
                    return {
                      success: false,
                      error_message: 'Unexpected error, please try again'
                    }
                  }
                })
                .catch(() => {
                  return {
                    success: false,
                    error_message: 'Unexpected error, please try again'
                  }
                })
            }
          } else {
            return {
              success: false,
              error_message: 'Not found'
            }
          }
        })
        .catch(err => {
          console.log(err)
          return { success: false, error_message: err.message }
        })
    })
    .catch(err => {
      console.log(err)
      return { success: false, error_message: err.message }
    })
})

function generateClaimVerificationCode(user_id, claim_id, phoneNumber) {
  let refCode = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5)
    .toUpperCase()
  let code = Math.random()
    .toString()
    .substr(2, 6)
  let validUntil = Math.round(new Date().getTime() / 1000) + (5 * 60)
  var http = require('https')
  var options = {
    method: 'POST',
    hostname: 'tm3swoarp5.execute-api.ap-southeast-1.amazonaws.com',
    port: null,
    path: '/production/sms',
    headers: {
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
  req.write(
    '{"message": "Your code is ' +
    code +
    ' (Ref: ' +
    refCode +
    ')", "phone_number": "' +
    phoneNumber +
    '"}'
  )
  req.end()
  let ref = admin.firestore().collection('users_claim')
  return ref
    .doc(user_id)
    .collection('claim_period')
    .doc(String(claim_id))
    .update({ ref_code: refCode, code: code, valid_until: validUntil })
    .then(() => {
      return { success: true, refCode: refCode, validUntil: validUntil }
    })
    .catch(err => {
      return { success: false, message: err.message }
    })
}

function generatePhoneVerificationCode(phoneNumber) {
  let refCode = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5)
    .toUpperCase()
  let code = Math.random()
    .toString()
    .substr(2, 6)
  let validUntil = Math.round(new Date().getTime() / 1000) + 300
  var http = require('https')
  var options = {
    method: 'POST',
    hostname: 'tm3swoarp5.execute-api.ap-southeast-1.amazonaws.com',
    port: null,
    path: '/production/sms',
    headers: {
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
  req.write(
    '{"message": "Your code is ' +
    code +
    ' (Ref: ' +
    refCode +
    ')", "phone_number": "' +
    phoneNumber +
    '"}'
  )
  req.end()
  let ref = admin.firestore().collection('phone-verifications')
  return ref
    .doc(phoneNumber)
    .set({ ref_code: refCode, code: code, valid_until: validUntil })
    .then(() => {
      return { success: true, refCode: refCode, validUntil: validUntil }
    })
    .catch(err => {
      return { success: false, message: err.message }
    })
}

exports.phoneVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let phoneNumber = data.phone_number
  return ref
    .doc(phoneNumber)
    .get()
    .then(doc => {
      if (doc.exists) {
        // if (doc.data().is_verified === true) {
        //  return {
        //    success: false,
        //    error_message: 'Phone number has already been used',
        //    error_code: 100
        //  }
        // } else {
        return generatePhoneVerificationCode(phoneNumber)
          .then(data => {
            if (data.success === true) {
              let refCode = data.refCode
              let validUntil = data.validUntil
              return {
                success: true,
                ref_code: refCode,
                valid_until: validUntil
              }
            } else {
              return {
                success: false,
                error_message: 'Unexpected error, please try again'
              }
            }
          })
          .catch(() => {
            return {
              success: false,
              error_message: 'Unexpected error, please try again'
            }
          })
        // }
      } else {
        return generatePhoneVerificationCode(phoneNumber)
          .then(data => {
            if (data.success === true) {
              let refCode = data.refCode
              let validUntil = data.validUntil
              return {
                success: true,
                ref_code: refCode,
                valid_until: validUntil
              }
            } else {
              return {
                success: false,
                error_message: 'Unexpected error, please try again'
              }
            }
          })
          .catch(() => {
            return {
              success: false,
              error_message: 'Unexpected error, please try again'
            }
          })
      }
    })
    .catch(err => {
      console.log(err)
      return { success: false, error_message: err.message }
    })
})

exports.phoneVerificationSubmitRedeem = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('phone-verifications')
  let userRef = admin.firestore().collection('users')
  let phoneNumber = data.phone_number
  let country = data.country
  let refCode = data.ref_code
  let code = data.code
  let thisEmail = data.email
  return admin.auth().getUserByEmail(thisEmail).then(userRecord => {
    const uid = userRecord.uid
    return ref
      .doc(phoneNumber)
      .get()
      .then(doc => {
        if (doc.exists) {
          if (
            doc.data().valid_until > Math.round(new Date().getTime() / 1000)
          ) {
            if (doc.data().ref_code === refCode && doc.data().code === code) {
              let batch = admin.firestore().batch()
              batch.set(ref.doc(phoneNumber), { is_verified: true })
              let dataToUpdate = {
                phone_number: phoneNumber,
                phone_verified: true
              }
              if (country !== undefined) {
                dataToUpdate.country = country
              }
              batch.update(userRef.doc(uid), dataToUpdate)
              return batch
                .commit()
                .then(() => {
                  return { success: true }
                })
                .catch(err => {
                  return { success: false, error_message: err.message }
                })
            } else {
              return {
                success: false,
                error_message: 'Invalid verification code',
                error_code: 200
              }
            }
          } else {
            return {
              success: false,
              error_message: 'Verification session expired',
              error_code: 300
            }
          }
        } else {
          return {
            success: false,
            error_message: 'Unexpected error, please try again'
          }
        }
      })
      .catch(err => {
        console.log(err)
        return { success: false, error_message: err.message }
      })
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
  return ref
    .doc(phoneNumber)
    .get()
    .then(doc => {
      if (doc.exists) {
        if (
          doc.data().valid_until > Math.round(new Date().getTime() / 1000)
        ) {
          if (doc.data().ref_code === refCode && doc.data().code === code) {
            let batch = admin.firestore().batch()
            batch.set(ref.doc(phoneNumber), { is_verified: true })
            let dataToUpdate = {
              phone_number: phoneNumber,
              phone_verified: true
            }
            if (country !== undefined) {
              dataToUpdate.country = country
            }
            batch.update(userRef.doc(uid), dataToUpdate)
            return batch
              .commit()
              .then(() => {
                return { success: true }
              })
              .catch(err => {
                return { success: false, error_message: err.message }
              })
          } else {
            return {
              success: false,
              error_message: 'Invalid verification code',
              error_code: 200
            }
          }
        } else {
          return {
            success: false,
            error_message: 'Verification session expired',
            error_code: 300
          }
        }
      } else {
        return {
          success: false,
          error_message: 'Unexpected error, please try again'
        }
      }
    })
    .catch(err => {
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
    return ref
      .doc(eth_address)
      .get()
      .then(doc => {
        if (doc.exists) {
          return {
            success: false,
            error_message: 'ETH address have been used'
          }
        } else {
          let batch = admin.firestore().batch()
          batch.set(ref.doc(eth_address), { uid: uid })
          batch.update(userRef.doc(uid), {
            eth_address: eth_address,
            submit_wallet: true
          })
          return batch
            .commit()
            .then(() => {
              return { success: true }
            })
            .catch(err => {
              return { success: false, error_message: err.message }
            })
        }
      })
  } else {
    return { success: false, error_message: 'ETH address could not be blank' }
  }
})

exports.updateTrustline = functions.https.onCall((data, context) => {
  const uid = context.auth.uid
  const public_key = data.public_key
  return admin.firestore().collection('users').doc(uid).update({
    add_trust_line: true
  }).then(admin.firestore().collection('users_claim').doc(uid).update({
    trustline: true
  })).then(() => {
    return {
      uid,
      public_key
    }
  }).then(setPublicKeyToSecondaryServer).then(() => {
    return {
      success: true
    }
  })
})

const setPublicKeyToSecondaryServer = ({ uid, public_key: publicKey }) => {
  // @TODO check is users exists?
  // @TODO check is users_claim exists?
  return request({
    uri: secondaryClaimUrl,
    method: 'POST',
    body: {
      uid,
      public_key: publicKey
    },
    json: true
  }).then(body => body.is_error ? Promise.reject(new Error(body.message)) : { uid, public_key: publicKey })
}

exports.updateXLMWallet = functions.https.onCall((data, context) => {
  const uid = context.auth.uid
  const xlm_address = data.xlm_address
  const ref = admin.firestore().collection('user-xlm-wallets')
  const userRef = admin.firestore().collection('users')
  if (xlm_address !== undefined && xlm_address !== null) {
    return ref
      .doc(xlm_address)
      .get()
      .then(doc => {
        if (doc.exists) {
          return {
            success: false,
            error_message: 'XLM address have been used'
          }
        } else {
          let batch = admin.firestore().batch()
          batch.set(ref.doc(xlm_address), { uid: uid })
          batch.update(userRef.doc(uid), {
            xlm_address: xlm_address,
            submit_xlm_wallet: true,
            use_old_account: true
          })
          return batch
            .commit()
            .then(() => {
              return handleCreateStellarAccount({ public_key: xlm_address }, context).then(response => {
                return { success: true }
              })
            })
            .catch(err => {
              return { success: false, error_message: err.message }
            })
        }
      })
  } else {
    return { success: false, error_message: 'XLM address could not be blank' }
  }
})

exports.reworkInitializeUserDoc = functions.https.onCall((data, context) => {
  const email = context.auth.token.email
  const registration_time = new Date().getTime()
  const uid = context.auth.uid
  let ref = admin
    .firestore()
    .collection('users')
    .doc(uid)
  return ref.set({ email: email, registration_time: registration_time, kyc_status: 'not_complete' }, { merge: true }).then(() => {
    return { success: true }
  }).catch(err => {
    return { success: false }
  })
})

exports.initializeUserDoc = functions.auth.user().onCreate(event => {
  const user = event.data
  const uid = user.uid
  console.log(user)
  const setUser = {
    email: user.email,
    registration_time: Date.now()
  }
  if (uid.substr(0, 4) === 'pri-') {
    const name = user.displayName.split(' ')
    setUser.private_user = true
    setUser.first_name = name[0]
    setUser.last_name = name[1]
    setUser.phone_number = user.phoneNumber
  }
  let ref = admin
    .firestore()
    .collection('users')
    .doc(user.uid)
  return ref.set({ email: email, registration_time: user.metadata.a, kyc_status: 'not_complete' }, { merge: true }).then(() => {
    return true
  })
})

function getTime() {
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

exports.hourly_xlm = functions.pubsub.topic('hourly-xlm').onPublish(event => {
  const baseToken = 'xlm'
  return handleHourlyEvent(event, baseToken)
})

exports.hourly_eth = functions.pubsub.topic('hourly-eth').onPublish(event => {
  const baseToken = 'eth'
  return handleHourlyEvent(event, baseToken)
})

exports.hourly_btc = functions.pubsub.topic('hourly-btc').onPublish(event => {
  const baseToken = 'btc'
  return handleHourlyEvent(event, baseToken)
})

function handleHourlyEvent(event, baseToken) {
  const time = getTime()
  const uri = getBasePriceURI(baseToken.toUpperCase())

  return request({
    uri,
    method: 'GET',
    json: true
  }).then(body => {
    return updateHourlyPrice(body, baseToken, time)
  })
}

function updateHourlyPrice(body, baseToken, time) {
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

exports.monitorETH = functions.pubsub
  .topic('monitor-eth')
  .onPublish(() => Promise.resolve(EthereumService.monitor()))

exports.monitorXLM = functions.pubsub
  .topic('monitor-xlm')
  .onPublish(stellarService)

exports.logsUserTable = functions.firestore
  .document('users/{userId}')
  .onWrite(event => {
    const document = event.data.exists ? event.data.data() : null
    const timestamp = Date.now()
    const oldDocument = event.data.previous.data()
    return admin
      .database()
      .ref(`logs/${timestamp}`)
      .set({ document, oldDocument })
  })

var _extends =
  Object.assign ||
  function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i]
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key]
        }
      }
    }
    return target
  }

var sendEmail = (function () {
  var _ref = _asyncToGenerator(
    /* #__PURE__ */ regeneratorRuntime.mark(function _callee(emails) {
      var _iteratorNormalCompletion,
        _didIteratorError,
        _iteratorError,
        _iterator,
        _step,
        email,
        mailOptions,
        result,
        path

      return regeneratorRuntime.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _iteratorNormalCompletion = true
                _didIteratorError = false
                _iteratorError = undefined
                _context.prev = 3
                _iterator = emails[Symbol.iterator]()

              case 5:
                if (
                  (_iteratorNormalCompletion = (_step = _iterator.next()).done)
                ) {
                  _context.next = 20
                  break
                }

                email = _step.value
                _context.next = 9
                break

              case 9:
                mailOptions = _context.sent
                _context.next = 12
                return mailTransport.sendMail(mailOptions)

              case 12:
                result = _context.sent
                _context.next = 15
                return Date.now()

              case 15:
                path = _context.sent

                admin
                  .firestore()
                  .collection('send_email_logs')
                  .doc(path.toString())
                  .set(
                    _extends({ to: email }, result, { timestamp: Date.now() })
                  )

              case 17:
                _iteratorNormalCompletion = true
                _context.next = 5
                break

              case 20:
                _context.next = 26
                break

              case 22:
                _context.prev = 22
                _context.t0 = _context['catch'](3)
                _didIteratorError = true
                _iteratorError = _context.t0

              case 26:
                _context.prev = 26
                _context.prev = 27

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return()
                }

              case 29:
                _context.prev = 29

                if (!_didIteratorError) {
                  _context.next = 32
                  break
                }

                throw _iteratorError

              case 32:
                return _context.finish(29)

              case 33:
                return _context.finish(26)

              case 34:
              case 'end':
                return _context.stop()
            }
          }
        },
        _callee,
        this,
        [[3, 22, 26, 34], [27, , 29, 33]]
      )
    })
  )

  return function sendEmail(_x) {
    return _ref.apply(this, arguments)
  }
})()

// f_toConsumableArrayunction (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value } catch (error) { reject(error); return } if (info.done) { resolve(value) } else { return Promise.resolve(value).then(function (value) { step('next', value) }, function (err) { step('throw', err) }) } } return step('next') }) } }

// function _asyncToGenerator(fn) {
//   return function() {
//     var gen = fn.apply(this, arguments);
//     return new Promise(function(resolve, reject) {
//       function step(key, arg) {
//         try {
//           var info = gen[key](arg);
//           var value = info.value;
//         } catch (error) {
//           reject(error);
//           return;
//         }
//         if (info.done) {
//           resolve(value);
//         } else {
//           return Promise.resolve(value).then(
//             function(value) {
//               step("next", value);
//             },
//             function(err) {
//               step("throw", err);
//             }
//           );
//         }
//       }
//       return step("next");
//     });
//   };
// }

// Upper function convert from this function should not remove.
// async function sendEmail  (emails) {
//   for(let email of emails) {
//     const mailOptions = await genKycReadyEmail({ email })
//     const result = await mailTransport.sendMail(mailOptions)
//     const path = await Date.now()
//     admin.firestore().collection('send_email_logs').doc(path.toString()).set({ to: email, ...result, timestamp: Date.now()})
//   }
// }

exports.sendKycReadyEmail = functions.https.onRequest((req, res) => {
  cors(req, res, () => { })
  console.log(req.body, 'req.body....')
  const { emails, password } = req.body
  let finish = []
  let fail = []
  if (password === 'ineedtosendemail') {
    sendEmail(emails)
    res.json({ success: true })
  } else {
    return res.status(400).json(new Error('Password not match'))
  }
})

function genReminderEmail(emails) {
  return new Promise((resolve, reject) => {
    let personalizations = []
    emails.forEach(email => {
      if (email && email.email !== null) {
        personalizations.push({
          'to': [{ email: email.email }],
          'subject': "SIX.network - Don't forget to submit your document"
        })
      }
    })
    const mailOptions = {
      personalizations,
      from: { email: 'no-reply@six.network' },
      content: [{
        type: 'text/html',
        value: `<div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);margin: 0;background: #F6F6F6">
          <div class="section" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;background: #F6F6F6;padding-bottom: 10px;height: 100%;z-index: 1">
          <!-- <img class="top-header" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fheader.png?alt=media&token=9f32b7f1-6def-45f2-bf1a-2cea15326450"
            alt=""> -->
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
            <div class="card-header" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;padding: 0;background: transparent;width: 100%">
              <img class="header-img" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fcover2.png?alt=media&amp;token=74bc44f8-f8e2-4a0d-aeca-6ee76ab2befb" alt="" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 100%;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);z-index: 10"/>
            </div>
            <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
                <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                    <h3 class="subtitle" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">(English content below)</h3>
                    <!-- thai -->
                    <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">สวัสดีครับ!</h2>
                    <h3 class="subtitle" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">ขอบคุณที่ให้ความสนใจกับ SIX.network นะครับ</h3>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">ในสัปดาห์ที่ผ่านมา เราได้เริ่มเปิดขาย token รอบ Pre-ICO ซึ่งได้ผลตอบรับที่ดีมาก เนื่องจากเราจะมี bonus พิเศษ +6%
                      ให้สำหรับทุกๆยอดที่มีการสั่งซื้อเข้ามา เช่น ซื้อทั้งหมด 10,000 SIX จะได้รับเพิ่มทันที 600 SIX มูลค่า ถึง 1,800
                      บาท !</p>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">ทั้งนี้เราเห็นว่าคุณยังไม่ส่งเอกสารเข้ามาเลยกลัวว่าจะพลาดโอกาสดีๆแบบนี้ไป คุณสามารถเข้าสู่ระบบ และส่งเอกสารยืนยันตัวตนเข้ามาเพื่อรับสิทธิ์
                      bonus 6% ก่อนที่จะหมดลงนะครับ</p>
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">เข้าสู่ระบบ: https://ico.six.network</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">วิธีการใช้งาน: https://ico.six.network/faq.html#howtobuy</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">ติดต่อทีมงาน: https://m.me/thesixnetwork</span>
                    </div>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">หวังว่าจะได้รับการตอบรับที่ดีจากคุณอีกนะครับ</p>
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">ขอบคุณครับ</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">ทีมงาน SIX network</span>
                    </div>
                    <div class="button-wrapper" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);text-align: center;padding: 20px">
                        <a href="https://goo.gl/H14G3B" target="_blank"  class="button" style="font-family: &quot;Prompt&quot;, sans-serif;color: #FFF;background: #3B409E;font-size: 16px;padding: 15px 20px;float: center;border-radius: 5px;margin-top: 10px;margin-bottom: 10px">ส่งเอกสาร</a>
                    </div>
                    <!-- end-thai -->

                    <!-- english -->
                    <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">Hello !</h2>
                    <h3 class="subtitle" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">Thank you for your interest in SIX.network</h3>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">We have already launched the pre-ICO and received a very good response. We will have a special bonus of 6% for every
                      purchase. For example, the purchase of 10,000 SIX will be offered an additional 600 SIX worth of 60 USD !!</p>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">It seems you have not submitted the document. </p>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">o ensure that you will get 6% bonus, please login and submit the documents before this offer period ended.</p>
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Log in: https://ico.six.network</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">How to buy: https://ico.six.network/faq.html#howtobuy</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Contact us: https://m.me/thesixnetwork</span>
                    </div>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Hope we get a good response from you again.</p>
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Thank you</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">SIX network team</span>
                    </div>
                    <div class="button-wrapper" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);text-align: center;padding: 20px">
                        <a href="https://goo.gl/fVxRmq" target="_blank" class="button" style="font-family: &quot;Prompt&quot;, sans-serif;color: #FFF;background: #3B409E;font-size: 16px;padding: 15px 20px;float: center;border-radius: 5px;margin-top: 10px;margin-bottom: 10px">Submit documents</a>
                    </div>
                    <!-- end-english -->
                  </div>
            </div>
          </div>
        </div>
      </div>
      `
      }]
    }
    resolve(mailOptions)
  })
}

function genRemindBonusExpireEmail(emails) {
  return new Promise((resolve, reject) => {
    let personalizations = []
    emails.forEach(email => {
      if (email && email.email !== null) {
        personalizations.push({
          'to': [{ email: email.email }],
          'subject': 'SIX.network - Remind Customer to contribute'
        })
      }
    })
    const mailOptions = {
      personalizations,
      from: { email: 'no-reply@six.network' },
      content: [{
        type: 'text/html',
        value: `<div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);margin: 0;background: #F6F6F6">
          <div class="section" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;background: #F6F6F6;padding-bottom: 10px;height: 100%;z-index: 1">
          <!-- <img class="top-header" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fheader.png?alt=media&token=9f32b7f1-6def-45f2-bf1a-2cea15326450"
            alt=""> -->
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
            <div class="card-header" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;padding: 0;background: transparent;width: 100%">
              <img class="header-img" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fcover2.png?alt=media&amp;token=74bc44f8-f8e2-4a0d-aeca-6ee76ab2befb" alt="" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 100%;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);z-index: 10"/>
            </div>
            <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
                <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                    <!-- thai -->
                    <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">เรียน ผู้ร่วมลงทุน</h2>
                    <dd> <p style="text-indent: 2.5em;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">    ทาง ซิคซ์ เนทเวิร์ค ขอแสดงความขอบคุณ ท่านผู้ร่วมลงทุนที่สนใจลงทุนในเหรียญ SIX Token จากการลงทะเบียนรอบ Pre-Sale SIX Token เพื่อรับโบนัส 6% ในช่วงต้นเดือนเมษายน 2561 ที่ผ่านมา อย่างไรก็ตามทางเรายังไม่ได้รับยอดโอนเงินจากท่านและมีความจำเป็นต้องเรียนแจ้ง ผู้ร่วมลงทุน ทราบว่า โบนัส 6% ใกล้จะสิ้นสุดและปิดการขายแล้ว</p>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"> ขอความกรุณาท่านผู้ร่วมลงทุนกรุณาทำการส่ง ETH ตามจำนวนที่ท่านได้ลงทะเบียนไว้และถ้าหากท่านผู้ร่วมลงทุนทำการโอนเหรียญ ETH เพื่อซื้อ SIX Token หลังจากนี้ ทางบริษัทขอเรียนแจ้งว่า ท่านผู้ร่วมลงทุนจะไม่ได้รับโบนัส 6% ตามที่กำหนด

                      bonus 6% ก่อนที่จะหมดลงนะครับ</p></dd>
                    <dd> <p style="text-indent: 2.5em;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">  ทั้งนี้ทางบริษัทต้องขออภัย หากท่านผู้ร่วมลงทุนได้ทำการโอนเหรียญ ETH หรือ XLM มาเพื่อทำการซื้อ SIX Token เรียบร้อยแล้ว </p>
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">จึงเรียนมาเพื่อโปรดทราบ</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">ทีมงาน SIX network</span>
                    </div>
                  </div>
            </div>
          </div
        </div>
      </div>
      `
      }]
    }
    resolve(mailOptions)
  })
}

function genRemindBonusExpireEmailEN(emails) {
  return new Promise((resolve, reject) => {
    let personalizations = []
    emails.forEach(email => {
      if (email && email.email !== null) {
        personalizations.push({
          'to': [{ email: email.email }],
          'subject': 'SIX.network - Remind Customer to contribute'
        })
      }
    })
    const mailOptions = {
      personalizations,
      from: { email: 'no-reply@six.network' },
      content: [{
        type: 'text/html',
        value: `<div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);margin: 0;background: #F6F6F6">
          <div class="section" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;background: #F6F6F6;padding-bottom: 10px;height: 100%;z-index: 1">
          <!-- <img class="top-header" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fheader.png?alt=media&token=9f32b7f1-6def-45f2-bf1a-2cea15326450"
            alt=""> -->
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
            <div class="card-header" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;padding: 0;background: transparent;width: 100%">
              <img class="header-img" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fcover2.png?alt=media&amp;token=74bc44f8-f8e2-4a0d-aeca-6ee76ab2befb" alt="" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 100%;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);z-index: 10"/>
            </div>
            <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
                <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                    <!-- thai -->
                    <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">To Investor</h2>
                    <dd> <p style="text-indent: 2.5em;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">      SIX Network is appreciate for your interesting to invest in SIX Token that by your registered for a Pre-Sale SIX Token to get 6% BONUS in early April. However SIX Network (Thailand) has not received the transfer amount for a Pre-Sale SIX Token yet.</p>
                    <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">      We to inform that 6% BONUS will be effective up to the short time for closing soon.</p></dd>
                    <dd> <p style="text-indent: 2.5em;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">  Please doing the transaction following our ETH address to buy SIX Token completely. If after this. SIX Network want to tell you that you will not loss 6% BONUS. Sorry if you are already transfer to ETH or XLM or if this e-mail is delay.</p>
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Please be informed accordingly</span>
                      <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)"/>
                      <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">SIX network</span>
                    </div>

                  </div>
            </div>
          </div>
          <div class="footer" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);text-align: center;padding: 20px;margin-top: 50px">
              <span class="credit" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">© Copyright Media Maxx Advertising</span>
          </div>
        </div>
      </div>
      `
      }]
    }
    resolve(mailOptions)
  })
}

function sendRemindEmails({ remind_status, email, doc, db, new_remind_status }) {
  genReminderEmail({ email: email })
    .then(mailOptions => {
      console.log(`PENDING: Sending email to: ${email}, from status: ${remind_status} to ${new_remind_status}`)
      return mailTransport.sendMail(mailOptions)
    })
    .then(result => {
      console.log(`SUCCESS: sent email to: ${email}, from status: ${remind_status} to ${new_remind_status}`)
      return db.doc(doc.id).update({ remind_status: new_remind_status, last_send_remind: Date.now() })
    })
    .catch(err => {
      console.log(`FAILURE: sent email to: ${email}, from status: ${remind_status} to ${new_remind_status}`)
      console.log(err, 'error send remind email')
    })
}

function updateRemindStatus(users) {
  const db = admin.firestore().collection('users')
  users.forEach(user => {
    const { id, new_remind_status, status, email } = user
    console.log(`PENDING: update user status ${email}`)
    return db.doc(id).update({ remind_status: new_remind_status, last_send_remind: Date.now() }).then(res => {
      console.log(`SUCCESS: update user status ${email}`)
      return res
    }).catch(err => {
      console.log(`ERROR: update user status ${email} with ${err}`)
      throw err
    })
  })
}

exports.remindEmails = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const db = admin.firestore().collection('users')
  const { password } = request.query
  if (password === 'ineedtosendemail') {
    db.get().then(docs => {
      let emailsList = []
      let sendList = []
      docs.forEach(doc => {
        const user = doc.data()
        const { remind_status, email, kyc_status, last_send_remind } = user
        if (kyc_status === 'not_complete') {
          if (remind_status && last_send_remind) {
            const diff = moment(new Date()).diff(moment(new Date(parseInt(last_send_remind))), 'days')
            switch (remind_status) {
              case 'd1':
                if (diff >= 4) sendList.push({ email, remind_status, new_remind_status: 'd4', id: doc.id })
                break
              case 'd4':
                if (diff >= 4) sendList.push({ email, remind_status, new_remind_status: 'd8', id: doc.id })
                break
              case 'd8':
                if (diff >= 7) sendList.push({ email, remind_status, new_remind_status: 'd8+7', id: doc.id })
                break
              case 'd8+7':
                if (diff >= 14) sendList.push({ email, remind_status, new_remind_status: 'd8+7(2)', id: doc.id })
                break
              case 'd8+7(2)':
                if (diff >= 21) sendList.push({ email, remind_status, new_remind_status: 'd8+7(3)', id: doc.id })
                break
              default:
                break
            }
          } else {
            sendList.push({ email, remind_status, new_remind_status: 'd1', id: doc.id })
          }
        }
      })
      if (sendList && sendList.length > 0) {
        updateRemindStatus(sendList, db)
        return genReminderEmail(sendList)
          .then(mailOptions => {
            return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: 'Bearer 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' } })
          })
          .then(res => {
            return response.json({ success: true, sendList })
          })
          .catch(err => {
            console.log((err.response || {}).data, 'err')
            console.log(err.message, 'err.message')
            return response.status(400).json({ error: (err.reponse || {}).data })
          })
      } else {
        return response.send({ success: true, sendList })
      }
    })
  } else {
    return response.status(400).json(new Error('Password not match'))
  }
})

exports.remindBonusExpireEmail = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const db = admin.firestore().collection('users')
  const { password } = request.query
  if (password === 'ineedtosendemail') {
    db.get().then(docs => {
      let emailsList = []
      let sendList = []
      docs.forEach(doc => {
        const user = doc.data()
        const { remind_status, email, kyc_status, last_send_remind, eth_address, estimate, country } = user
        const notFoundEstimate = !estimate || estimate === null || estimate === ''
        const isTH = country === 'TH'
        if (isTH && eth_address && eth_address !== null && notFoundEstimate) {
          sendList.push({ email })
        }
      })
      if (sendList && sendList.length > 0) {
        return genRemindBonusExpireEmail(sendList)
          .then(mailOptions => {
            return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
          })
          .then(res => {
            return response.json({ success: true, sendList })
          })
          .catch(err => {
            console.log((err.response || {}).data, 'err')
            console.log(err.message, 'err.message')
            return response.status(400).json({ error: (err.reponse || {}).data })
          })
      } else {
        return response.send({ success: true, sendList })
      }
    })
  } else {
    return response.status(400).json(new Error('Password not match'))
  }
})

exports.remindBonusExpireEmailEN = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const db = admin.firestore().collection('users')
  const { password } = request.query
  if (password === 'ineedtosendemail') {
    db.get().then(docs => {
      let emailsList = []
      let sendList = []
      console.log(sendList, 'sendList...')
      docs.forEach(doc => {
        const user = doc.data()
        const { remind_status, email, kyc_status, last_send_remind, eth_address, estimate, country } = user
        const notFoundEstimate = !estimate || estimate === null || estimate === ''
        const notThandKr = country !== 'TH' && country !== 'KR'
        if (notThandKr && eth_address && eth_address !== null && notFoundEstimate) {
          sendList.push({ email })
        }
      })
      if (sendList && sendList.length > 0) {
        return genRemindBonusExpireEmailEN(sendList)
          .then(mailOptions => {
            return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
          })
          .then(res => {
            return response.json({ success: true, sendList })
          })
          .catch(err => {
            console.log((err.response || {}).data, 'err')
            console.log(err.message, 'err.message')
            return response.status(400).json({ error: (err.reponse || {}).data })
          })
      } else {
        return response.send({ success: true, sendList })
      }
    })
  } else {
    return response.status(400).json(new Error('Password not match'))
  }
})

exports.createClaim = functions.https.onRequest(handleCreateStellarAccount)
exports.claimSix = functions.https.onRequest(handleClaimSix)

function genLastBonusEmail(emails) {
  return new Promise((resolve, reject) => {
    let personalizations = []
    console.log(emails, 'emails....')
    emails.forEach(email => {
      if (email && email !== null) {
        personalizations.push({
          'to': [{ email }],
          'subject': '[SIX network] - Our 6% bonus campaign has been closed!'
        })
      }
    })
    const mailOptions = {
      personalizations,
      from: { email: 'no-reply@six.network' },
      content: [{
        type: 'text/html',
        value: `
        <div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);margin: 0;background: #F6F6F6">
        <div class="section" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;background: #F6F6F6;padding-bottom: 10px;height: 100%;z-index: 1">
          <!-- <img class="top-header" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fheader.png?alt=media&token=9f32b7f1-6def-45f2-bf1a-2cea15326450"
            alt=""> -->
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
            <div class="card-header" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;padding: 0;background: transparent;width: 100%">
              <img class="header-img" src="https://firebasestorage.googleapis.com/v0/b/six-dashboard.appspot.com/o/public%2FS__18350212.jpg?alt=media&token=fd19f8af-b64a-4115-b14d-3e070c31039c"
                alt="" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 100%;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);z-index: 10"
              />
            </div>
            <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
              <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                <!-- thai -->
                <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">Hi everyone,</h2>
                <span>(Korean version below)</span>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Thanks to the high demand, our pre-sale has been ended. </p>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">6% bonus will automatically be added to at the account of those who make a contribution within 19 May 2018 at 23.59 GMT+9. </p>

                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">However, you can contribute to our ICO until 31 May 2018.</p>

                  <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                      <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                        <br />
                        <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Cheers!</span>
                        <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)" />
                        <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">SIX network team</span>
                      </div>
                    </div>
              </div>
            </div>
          </div>
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
              <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
                <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                  <!-- thai -->
                  <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">여러분의 많은 관심과 성원 덕분에 프리세일이 마감되었습니다.</p>
                  <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">2018년 5월 19일 23시 59분 GMT+9 이내로 이체를 완료해주신 분들께는 자동으로 6% 보너스 혜택이 적용됩니다.</p>

                  <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">보너스 혜택 기간은 끝났지만, 2018년 5월 31일까지 ICO에 참여하실 수 있습니다.</p>

                    <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                        <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                          <br />
                          <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">감사합니다</span>
                          <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)" />
                          <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">식스네트워크팀 드림</span>
                        </div>
                      </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    `
      }]
    }
    resolve(mailOptions)
  })
}

exports.sendLastBonusToSubscriber = functions.https.onRequest(function () {
  var _ref = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee(request, response) {
    var password, emailsList, sendList, initial, list_send, i, from, to, t, mailOptions
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0

            cors(request, response, function () { })
            password = request.query.password

            if (!(password === 'ineedtosendemail')) {
              _context.next = 28
              break
            }

            emailsList = []
            sendList = activecampaign_subscriber

            if (!(sendList && sendList.length > 0)) {
              _context.next = 26
              break
            }

            initial = 0
            list_send = []
            i = 1

          case 10:
            if (!(i <= sendList.length / 1000)) {
              _context.next = 25
              break
            }

            from = initial
            to = i * 1000
            t = sendList.slice(from, to)

            console.log(t, 't....')
            _context.next = 17
            return genLastBonusEmail(t)

          case 17:
            mailOptions = _context.sent
            _context.next = 20
            return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: 'Bearer ' + SENDGRID_API_KEY } })

          case 20:
            list_send.push(t)
            initial = to

          case 22:
            i++
            _context.next = 10
            break

          case 25:
            return _context.abrupt('return', response.send({ success: true, list_send: list_send }))

          case 26:
            _context.next = 29
            break

          case 28:
            return _context.abrupt('return', response.status(400).json(new Error('Password not match')))

          case 29:
            _context.next = 34
            break

          case 31:
            _context.prev = 31
            _context.t0 = _context['catch'](0)
            return _context.abrupt('return', response.status(400).json(_context.t0))

          case 34:
          case 'end':
            return _context.stop()
        }
      }
    }, _callee, undefined, [[0, 31]])
  }))

  return function (_x, _x2) {
    return _ref.apply(this, arguments)
  }
}())

exports.sendLastBonusToUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const db = admin.firestore().collection('users')
  const { password } = request.query
  if (password === 'ineedtosendemail') {
    db.get().then(docs => {
      let emailsList = []
      let sendList = []
      docs.forEach(doc => {
        if (email && email !== null) {
          sendList.push({ email })
        }
      })
      if (sendList && sendList.length > 0) {
        return genLastBonusEmail(sendList)
          .then(mailOptions => {
            return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
          })
          .then(res => {
            return response.json({ success: true, sendList })
          })
          .catch(err => {
            console.log((err.response || {}).data, 'err')
            console.log(err.message, 'err.message')
            return response.status(400).json({ error: (err.reponse || {}).data })
          })
      } else {
        return response.send({ success: true, sendList })
      }
    })
  } else {
    return response.status(400).json(new Error('Password not match'))
  }
})

// ico close
function genICOCloseEmail(emails) {
  return new Promise((resolve, reject) => {
    let personalizations = []
    console.log(emails, 'emails....')
    emails.forEach(email => {
      if (email && email !== null) {
        if (typeof email === 'string') {
          console.log(email, 'email...')
          personalizations.push({
            'to': [{ email: email }],
            'subject': '[SIX network] Free 20 SIX token for those who passed the KYC process by this Saturday'
          })
        } else {
          console.log(email, 'email...')
          personalizations.push({
            'to': [{ email: email.email }],
            'subject': '[SIX network] Free 20 SIX token for those who passed the KYC process by this Saturday'
          })
        }
      }
    })
    const mailOptions = {
      personalizations,
      from: { email: 'no-reply@six.network' },
      content: [{
        type: 'text/html',
        value: `
        <div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);margin: 0;background: #F6F6F6">
        <div class="section" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;background: #F6F6F6;padding-bottom: 10px;height: 100%;z-index: 1">
          <!-- <img class="top-header" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fheader.png?alt=media&token=9f32b7f1-6def-45f2-bf1a-2cea15326450"
            alt=""> -->
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
            <div class="card-header" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;padding: 0;background: transparent;width: 100%">
              <img class="header-img" src="https://firebasestorage.googleapis.com/v0/b/six-dashboard.appspot.com/o/public%2FS__18628690.jpg?alt=media&token=80f74e49-347f-4bbf-abe0-7594c281e876"
                alt="" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 100%;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);z-index: 10"
              />
            </div>
            <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
              <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                <!-- thai -->
                <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">Hi there,</h2>
                <span>(Korean version below)</span>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">There are 9 days left before our ICO will close.</p>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">We have a good news to the person who did not finish the document submission. </p>

                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">From 22 May 2018 21.00 GMT+9 to 27 May 2018 23.59 GMT+9, every person who successfully submit their document and get approved on KYC process will get free 20 SIX token automatically added to their account.</p>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">
                  But don't worry, for the people who have already got approved to our KYC before this "KYC Bounty Campaign" will get this reward as well.
                </p>
                <br />

              <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                  <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Thank you for your always supporting on us!</span>
                  <br />
                  <br />
                  <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">Cheers!</span>
                  <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)" />
                  <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">SIX network team</span>
                </div>
              </div>
              </div>
            </div>
          </div>
          <div class="card" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);width: 80%;padding: 0;padding-top: 2%;z-index: 100;margin-left: 10%;background: transparent">
            <div class="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
              <div class="container" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
                <!-- thai -->
                <h2 class="title" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">안녕하세요 여러분.</h2>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">식스 네트워크 종료일까지 9일이 남았습니다.</p>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">아직 KYC 관련 서류를 제출하지 못한 분들께 좋은 소식이 있습니다.</p>

                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">2018년 5월 22일 21시부터 2018년 5월 27일 23시 59분까지, KYC에 필요한 서류를 제출하고 KYC 인증이 성공적으로 승인된 모든 분들께 20 SIX 토큰을 식스 계정으로 자동 지급하는 캠페인을 진행합니다. </p>
                <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">
                  "KYC 바운티 캠페인" 이전에 KYC에 승인된 분들께도 보상이 지급되니 걱정하지 않으셔도 됩니다.
                </p>
                <br />

              <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                <div class="p-group" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)">
                  <br />
                  <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">항상 보내주시는 성원과 지지에 감사드립니다!</span>
                  <br style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1)" />
                  <span style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">식스 네트워크 드림</span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
      }]
    }
    resolve(mailOptions)
  })
}

exports.sendICOCloseToSubscribers = functions.https.onRequest(function () {
  var _ref = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee(request, response) {
    var password, emailsList, sendList, initial, list_send, i, from, to, t, mailOptions
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0

            cors(request, response, function () { })
            password = request.query.password

            if (!(password === 'ineedtosendemail')) {
              _context.next = 28
              break
            }

            emailsList = []
            sendList = activecampaign_subscriber

            if (!(sendList && sendList.length > 0)) {
              _context.next = 26
              break
            }

            initial = 0
            list_send = []
            i = 1

          case 10:
            if (!(i <= sendList.length / 1000)) {
              _context.next = 25
              break
            }

            from = initial
            to = i * 1000
            t = sendList.slice(from, to)

            console.log(t, 't....')
            _context.next = 17
            return genICOCloseEmail(t)

          case 17:
            mailOptions = _context.sent
            _context.next = 20
            return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: 'Bearer ' + SENDGRID_API_KEY } })

          case 20:
            list_send.push(t)
            initial = to

          case 22:
            i++
            _context.next = 10
            break

          case 25:
            return _context.abrupt('return', response.send({ success: true, list_send: list_send }))

          case 26:
            _context.next = 29
            break

          case 28:
            return _context.abrupt('return', response.status(400).json(new Error('Password not match')))

          case 29:
            _context.next = 34
            break

          case 31:
            _context.prev = 31
            _context.t0 = _context['catch'](0)
            return _context.abrupt('return', response.status(400).json(_context.t0))

          case 34:
          case 'end':
            return _context.stop()
        }
      }
    }, _callee, undefined, [[0, 31]])
  }))

  return function (_x, _x2) {
    return _ref.apply(this, arguments)
  }
}())

exports.sendICOCloseToUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const db = admin.firestore().collection('users')
  const { password } = request.query
  try {
    if (password === 'ineedtosendemail') {
      db.get().then(docs => {
        let emailsList = []
        let sendList = []
        docs.forEach(doc => {
          const user = doc.data()
          if (user.email && user.email !== null) {
            const { remind_status, email, kyc_status, last_send_remind } = user
            if (kyc_status) {
              if (kyc_status === 'not_complete' || kyc_status === 'pending' || kyc_status === 'rejected') {
                sendList.push({ email: email })
              }
            }
          }
        })
        console.log(sendList, 'sendList...')
        if (sendList && sendList.length > 0) {
          if (sendList && sendList.length > 1000) {
            const new_send_list = sendList.slice(0, 1000)
            const last_send_list = sendList.slice(1000, sendList.length - 1)
            return genICOCloseEmail(new_send_list)
              .then(mailOptions => {
                return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
              })
              .then(res => {
                return genICOCloseEmail(last_send_list)
              })
              .then(mailOptions_two => {
                return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions_two, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
              })
              .then(res => {
                return response.json({ success: true, sendList: [...new_send_list, ...last_send_list] })
              })
              .catch(err => {
                console.log(err, 'error')
                return response.status(400).json({ error: err })
              })
          } else {
            return genICOCloseEmail(sendList)
              .then(mailOptions => {
                console.log(mailOptions)
                return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
              })
              .then(res => {
                console.log(res, 'res...')
                return response.json({ success: true, sendList })
              })
              .catch(err => {
                console.log(err, 'error sendgrid')
                return response.status(400).json({ error: err.response })
              })
          }
        } else {
          return response.send({ success: true, sendList })
        }
      })
    } else {
      return response.status(400).json(new Error('Password not match'))
    }
  } catch (err) {
    return response.status(400).json(err)
  }
})

exports.getPurchasedUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const { password } = request.query
  if (password === 'sixsendmailtoday') {
    admin.firestore().collection('users').where('total_six', '>', 20).get().then(snapshots => {
      let users = []
      snapshots.forEach(snapshot => {
        const data = snapshot.data()
        const { email } = data
        users.push(email)
      })
      response.send(users)
    })
  } else {
    response.send({
      error: 'Password Incorrect.'
    })
  }
})

exports.getNotPurchasedUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const { password } = request.query
  if (password === 'sixsendmailtoday') {
    admin.firestore().collection('users').get().then(snapshots => {
      let users = []
      snapshots.forEach(snapshot => {
        const data = snapshot.data()
        const { email, total_six } = data
        if (total_six && total_six !== null) {
          if (total_six < 20) {
            if (email && email !== null) {
              users.push(email)
            }
          }
        } else {
          if (email && email !== null) {
            users.push(email)
          }
        }
      })
      response.send(users)
    })
  } else {
    response.send({
      error: 'Password Incorrect.'
    })
  }
})

exports.getUserByCountry = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const { password } = request.query
  if (password === 'sixsendmailtoday') {
    const { country, without } = request.query
    let query = admin.firestore().collection('users')
    if (country && country !== null) {
      query = admin.firestore().collection('users').where('country', '==', country)
    }
    // if (without && without !== null) {
    //   query = admin.firestore().collection('users').where('country', '!=', without)
    // }
    query.get().then(snapshots => {
      let users = []
      snapshots.forEach(snapshot => {
        const data = snapshot.data()
        const { email, total_six, country: user_country } = data
        if (without && without !== null) {
          if (user_country && user_country !== without) {
            if (email && email !== null) {
              users.push(email)
            }
          }
        } else {
          if (email && email !== null) {
            users.push(email)
          }
        }
      })
      response.send(users)
    })
  } else {
    response.send({
      error: 'Password Incorrect.'
    })
  }
})

exports.getTwentySixUser = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const { password } = request.query
  if (password === 'sixsendmailtoday') {
    admin.firestore().collection('users').where('total_six', '==', 20).get().then(snapshots => {
      let users = []
      snapshots.forEach(snapshot => {
        const data = snapshot.data()
        const { email } = data
        users.push(email)
      })
      response.send(users)
    })
  } else {
    response.send({
      error: 'Password Incorrect.'
    })
  }
})

exports.createClaim = functions.https.onCall(handleCreateStellarAccount)
exports.claimSix = functions.https.onCall(handleClaimSix)

exports.claim4TestHandle = functions.https.onRequest((req, res) => {
  const uid = req.body.uid
  const claim_id = req.body.claim_id
  handleClaimSix({ claim_id }, { auth: { uid } }).then(r => {
    res.json(r)
  })
})

exports.submitRedeemCode = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('users')
  let redeemCode = data.redeem_code
  let thisEmail = data.email
  if (redeemCode === undefined || thisEmail === undefined) return { success: false }
  return ref.where('redeem_code', '==', redeemCode).get().then(docs => {
    let found = false
    let foundPhone = false
    let verifiedPhone = false
    let foundCounter = 0
    let phoneNumber
    docs.forEach(doc => {
      if (doc.data().email === thisEmail) {
        found = true
        foundCounter++
      }
      if (doc.data().phone_number !== undefined) {
        foundPhone = true
        phoneNumber = doc.data().phone_number
      }
      if (doc.data().phone_verified === true) {
        verifiedPhone = true
      }
    })
    if (found && foundCounter === 1) {
      if (foundPhone && verifiedPhone !== true) {
        return generatePhoneVerificationCode(phoneNumber)
          .then(data => {
            if (data.success === true) {
              let refCode = data.refCode
              let validUntil = data.validUntil
              return {
                success: true,
                type: 1,
                ref_code: refCode,
                valid_until: validUntil,
                phone_number: phoneNumber
              }
            } else {
              return {
                success: false,
                message: 'Unexpected error, please try again'
              }
            }
          })
          .catch(() => {
            return {
              success: false,
              message: 'Unexpected error, please try again'
            }
          })
      } else {
        return { success: true, type: 0 }
      }
    } else {
      return { success: false, message: 'Invalid redeem code' }
    }
  })
})

exports.changeRedeemPassword = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection('users')
  let redeemCode = data.redeem_code
  let thisEmail = data.email
  let newPassword = data.password
  if (redeemCode === undefined || thisEmail === undefined) return { success: false }
  return ref.where('redeem_code', '==', redeemCode).get().then(docs => {
    let found = false
    let foundCounter = 0
    docs.forEach(doc => {
      if (doc.data().email === thisEmail) {
        found = true
        foundCounter++
      }
    })
    if (found && foundCounter === 1) {
      return admin.auth().getUserByEmail(thisEmail).then(userRecord => {
        return admin.auth().updateUser(userRecord.uid, {
          password: newPassword
        }).then(() => {
          ref.doc(userRecord.uid).update({ redeem_code: admin.firestore.FieldValue.delete(), is_redeem_account: true }).then(() => {
            return { success: true }
          }).catch(() => {
            return { success: false, message: 'Unexpected Error occured' }
          })
        })
      })
    } else {
      return { success: false, message: 'Invalid redeem code' }
    }
  })
})

exports.getPrivateUsers = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const { password, type } = request.query
  if (password === 'sixsendmailtoday') {
    admin.firestore().collection('users').where('private_user', '==', true).get().then(snapshots => {
      let users = []
      snapshots.forEach(snapshot => {
        const data = snapshot.data()
        const { email, redeem_code, country, phone_number } = data
        if (redeem_code && redeem_code !== null) {
          users.push({ email, redeem_code, country, phone_number })
        }
      })
      response.send(users)
    })
  } else {
    response.send({
      error: 'Password Incorrect.'
    })
  }
})

exports.processNewClaimPool = functions.https.onRequest((request, response) => {
  cors(request, response, () => { })
  const { password } = request.query
  if (password === 'this should not occur nonono') {
    claimService.poolUtilities.processNewClaimPool()
    response.send('ok')
  } else {
    response.send({
      error: 'Password Incorrect.'
    })
  }
})
