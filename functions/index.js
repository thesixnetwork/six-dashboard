const admin = require("firebase-admin");
const StellarSdk = require('stellar-sdk')
const functions = require("firebase-functions");
const request = require("request-promise");
const moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });
const regeneratorRuntime = require("regenerator-runtime");
const sgTransport = require("nodemailer-sendgrid-transport");
const axios = require('axios')

admin.initializeApp(functions.config().firebase);

const EthereumService = require("./service-ethereum");
const stellarService = require("./stellar-service");
const claimService= require('./claim-service')

const handleCreateStellarAccount = claimService.handleCreateStellarAccount
const handleClaimSix = claimService.handleClaimSix

const fireStore = admin.firestore();

require("./initialFireStoreData")(fireStore);

const account = {
  user: "apikey",
  pass: "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"
};

const sgOptions = {
  auth: {
    api_key:
      "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"
  }
};

const mailTransport = nodemailer.createTransport(sgTransport(sgOptions));

const triggers = require("./trigger")(functions, fireStore);
for (let trigger of triggers) {
  exports[trigger.name] = trigger.module;
}

const userModels = require("./model/user")(functions, fireStore);
for (let trigger of userModels) {
  exports[trigger.name] = trigger.module;
}

const getBasePriceURI = coin =>
  `https://min-api.cryptocompare.com/data/price?fsym=${coin}&tsyms=USD`;

exports.incrementTotalAsset = functions.firestore
  .document("/purchase_txs/{txId}")
  .onCreate(event => {
    const data = event.data.data();
    console.log(
      "Create Transaction:",
      event.params.txId,
      data.type,
      data.native_amount
    );
    const assetCol = fireStore.collection("total_asset");
    return fireStore.runTransaction(tx =>
      Promise.all(
        [
          { type: data.type, key: "native_amount" },
          { type: "usd", key: "total_usd_price" },
          { type: "six", key: "six_amount" }
        ].map(asset => {
          const ref = assetCol.doc(asset.type);
          return tx
            .get(ref)
            .then(assetDoc =>
              tx.update(ref, { total: assetDoc.data().total + data[asset.key] })
            );
        })
      )
    );
  });


const issuerKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.issuer_low_secret
)
const distKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.ico_distributor_secret
)


exports.claimOTPSubmit = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection("users_claim");
  let claimId = String(data.claim_id);
  let refCode = data.ref_code;
  let code = data.code;
  const uid = context.auth.uid;
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
            error_message: "Claimed"
          };
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

              return claimService.findUser({
                uid,
                claim_id: claimId
              })
              .then(claimService.findClaim)
              .then(claimService.sendSix)
              .then(claimService.updateClaim)
              .then(() => {
                return {
                  success: true
                }
              })
              .catch(error => {
                console.log(error)
                return {
                  success: false,
                  error_message: error
                }
             })




            } else {
              return {
                success: false,
                error_message: "Invalid verification code"
              };
            }
          } else {
            return {
              success: false,
              error_message: "Verification session expired"
            };
          }
        }
      } else {
        return {
          success: false,
          error_message: "Unexpected error, please try again"
        };
      }
    })
    .catch(err => {
      console.log(err);
      return { success: false, error_message: err.message };
    });
})

exports.claimVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection("users_claim");
  let userref = admin.firestore().collection("users");
  let user_id = context.auth.uid;
  let claim_id = data.claim_id;
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
              error_message: "Claimed"
            };
          } else {
            return generateClaimVerificationCode(user_id, claim_id, phone_number)
              .then(data => {
                if (data.success === true) {
                  let refCode = data.refCode;
                  let validUntil = data.validUntil;
                  return {
                    success: true,
                    ref_code: refCode,
                    valid_until: validUntil,
                    phone_number: phone_number
                  };
                } else {
                  return {
                    success: false,
                    error_message: "Unexpected error, please try again"
                  };
                }
              })
              .catch(() => {
                return {
                  success: false,
                  error_message: "Unexpected error, please try again"
                };
              });
          }
        } else {
          return {
              success: false,
              error_message: "Not found"
            }
        }
      })
      .catch(err => {
        console.log(err);
        return { success: false, error_message: err.message };
      });
    })
    .catch(err => {
      console.log(err);
      return { success: false, error_message: err.message };
    });
});

function generateClaimVerificationCode(user_id, claim_id, phoneNumber) {
  let refCode = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5)
    .toUpperCase();
  let code = Math.random()
    .toString()
    .substr(2, 6);
  let validUntil = Math.round(new Date().getTime() / 1000) + 180;
  var http = require("https");
  var options = {
    method: "POST",
    hostname: "xisth3qe4e.execute-api.ap-southeast-1.amazonaws.com",
    port: null,
    path: "/production/sms",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache"
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
  req.write(
    '{"message": "Your code is ' +
      code +
      " (Ref: " +
      refCode +
      ')", "phone_number": "' +
      phoneNumber +
      '"}'
  );
  req.end();
  let ref = admin.firestore().collection("users_claim");
  return ref
    .doc(user_id)
    .collection('claim_period')
    .doc(String(claim_id))
    .update({ ref_code: refCode, code: code, valid_until: validUntil })
    .then(() => {
      return { success: true, refCode: refCode, validUntil: validUntil };
    })
    .catch(err => {
      return { success: false, message: err.message };
    });
}

function generatePhoneVerificationCode(phoneNumber) {
  let refCode = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5)
    .toUpperCase();
  let code = Math.random()
    .toString()
    .substr(2, 6);
  let validUntil = Math.round(new Date().getTime() / 1000) + 180;
  var http = require("https");
  var options = {
    method: "POST",
    hostname: "xisth3qe4e.execute-api.ap-southeast-1.amazonaws.com",
    port: null,
    path: "/production/sms",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache"
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
  req.write(
    '{"message": "Your code is ' +
      code +
      " (Ref: " +
      refCode +
      ')", "phone_number": "' +
      phoneNumber +
      '"}'
  );
  req.end();
  let ref = admin.firestore().collection("phone-verifications");
  return ref
    .doc(phoneNumber)
    .set({ ref_code: refCode, code: code, valid_until: validUntil })
    .then(() => {
      return { success: true, refCode: refCode, validUntil: validUntil };
    })
    .catch(err => {
      return { success: false, message: err.message };
    });
}

exports.phoneVerificationRequest = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection("phone-verifications");
  let phoneNumber = data.phone_number;
  return ref
    .doc(phoneNumber)
    .get()
    .then(doc => {
      if (doc.exists) {
        if (doc.data().is_verified === true) {
          return {
            success: false,
            error_message: "Phone number has already been used"
          };
        } else {
          return generatePhoneVerificationCode(phoneNumber)
            .then(data => {
              if (data.success === true) {
                let refCode = data.refCode;
                let validUntil = data.validUntil;
                return {
                  success: true,
                  ref_code: refCode,
                  valid_until: validUntil
                };
              } else {
                return {
                  success: false,
                  error_message: "Unexpected error, please try again"
                };
              }
            })
            .catch(() => {
              return {
                success: false,
                error_message: "Unexpected error, please try again"
              };
            });
        }
      } else {
        return generatePhoneVerificationCode(phoneNumber)
          .then(data => {
            if (data.success === true) {
              let refCode = data.refCode;
              let validUntil = data.validUntil;
              return {
                success: true,
                ref_code: refCode,
                valid_until: validUntil
              };
            } else {
              return {
                success: false,
                error_message: "Unexpected error, please try again"
              };
            }
          })
          .catch(() => {
            return {
              success: false,
              error_message: "Unexpected error, please try again"
            };
          });
      }
    })
    .catch(err => {
      console.log(err);
      return { success: false, error_message: err.message };
    });
});

exports.phoneVerificationSubmit = functions.https.onCall((data, context) => {
  let ref = admin.firestore().collection("phone-verifications");
  let userRef = admin.firestore().collection("users");
  let phoneNumber = data.phone_number;
  let country = data.country;
  let refCode = data.ref_code;
  let code = data.code;
  const uid = context.auth.uid;
  return ref
    .doc(phoneNumber)
    .get()
    .then(doc => {
      if (doc.exists) {
        //if (doc.data().is_verified === true) {
        //  return {
        //    success: false,
        //    error_message: "Phone number has already been used"
        //  };
        //} else {
          if (
            doc.data().valid_until > Math.round(new Date().getTime() / 1000)
          ) {
            if (doc.data().ref_code === refCode && doc.data().code === code) {
              let batch = admin.firestore().batch();
              batch.set(ref.doc(phoneNumber), { is_verified: true });
              batch.update(userRef.doc(uid), {
                phone_number: phoneNumber,
                phone_verified: true,
                country: country
              });
              return batch
                .commit()
                .then(() => {
                  return { success: true };
                })
                .catch(err => {
                  return { success: false, error_message: err.message };
                });
            } else {
              return {
                success: false,
                error_message: "Invalid verification code"
              };
            }
          } else {
            return {
              success: false,
              error_message: "Verification session expired"
            };
          }
        //}
      } else {
        return {
          success: false,
          error_message: "Unexpected error, please try again"
        };
      }
    })
    .catch(err => {
      console.log(err);
      return { success: false, error_message: err.message };
    });
});

exports.updateETHWallet = functions.https.onCall((data, context) => {
  const uid = context.auth.uid;
  const eth_address = data.eth_address;
  const ref = admin.firestore().collection("user-eth-wallets");
  const userRef = admin.firestore().collection("users");
  if (eth_address !== undefined && eth_address !== null) {
    return ref
      .doc(eth_address)
      .get()
      .then(doc => {
        if (doc.exists) {
          return {
            success: false,
            error_message: "ETH address have been used"
          };
        } else {
          let batch = admin.firestore().batch();
          batch.set(ref.doc(eth_address), { uid: uid });
          batch.update(userRef.doc(uid), {
            eth_address: eth_address,
            submit_wallet: true
          });
          return batch
            .commit()
            .then(() => {
              return { success: true };
            })
            .catch(err => {
              return { success: false, error_message: err.message };
            });
        }
      });
  } else {
    return { success: false, error_message: "ETH address could not be blank" };
  }
});

exports.updateTrustline = functions.https.onCall((data, context) => {
  const uid = context.auth.uid
  return admin.firestore().collection('users').doc(uid).update({
      add_trust_line: true
    }).then(admin.firestore().collection('users_claim').doc(uid).update({
      trustline: true
    })).then(() => {
      return {
        success: true
      }
    })
})

exports.updateXLMWallet = functions.https.onCall((data, context) => {
  const uid = context.auth.uid;
  const xlm_address = data.xlm_address;
  const ref = admin.firestore().collection("user-xlm-wallets");
  const userRef = admin.firestore().collection("users");
  if (xlm_address !== undefined && xlm_address !== null) {
    return ref
      .doc(xlm_address)
      .get()
      .then(doc => {
        if (doc.exists) {
          return {
            success: false,
            error_message: "XLM address have been used"
          };
        } else {
          let batch = admin.firestore().batch();
          batch.set(ref.doc(xlm_address), { uid: uid });
          batch.update(userRef.doc(uid), {
            xlm_address: xlm_address,
            submit_xlm_wallet: true,
            use_old_account: true
          });
          return batch
            .commit()
            .then(() => {
              return { success: true };
            })
            .catch(err => {
              return { success: false, error_message: err.message };
            });
        }
      });
  } else {
    return { success: false, error_message: "XLM address could not be blank" };
  }
});

exports.initializeUserDoc = functions.auth.user().onCreate(event => {
  const user = event.data;
  const uid = user.uid;
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
    .collection("users")
    .doc(user.uid);
  return ref.set(setUser, { merge: true }).then(() => {
    return true;
  });
});

function getTime() {
  const time = new Date();

  if (time.getMinutes > 55) {
    time.setHours(time.getHours() + 1);
  }

  time.setMinutes(0, 0, 0);

  const timeString = moment.tz(time, "Asia/Bangkok").toString();

  return {
    unix: time.getTime(),
    string: timeString
  };
}

exports.hourly_xlm = functions.pubsub.topic("hourly-xlm").onPublish(event => {
  const baseToken = "xlm";
  return handleHourlyEvent(event, baseToken);
});

exports.hourly_eth = functions.pubsub.topic("hourly-eth").onPublish(event => {
  const baseToken = "eth";
  return handleHourlyEvent(event, baseToken);
});

exports.hourly_btc = functions.pubsub.topic("hourly-btc").onPublish(event => {
  const baseToken = "btc";
  return handleHourlyEvent(event, baseToken);
});

function handleHourlyEvent(event, baseToken) {
  const time = getTime();
  const uri = getBasePriceURI(baseToken.toUpperCase());

  return request({
    uri,
    method: "GET",
    json: true
  }).then(body => {
    return updateHourlyPrice(body, baseToken, time);
  });
}

function updateHourlyPrice(body, baseToken, time) {
  const price = body.USD / 0.1;
  return fireStore
    .collection(`${baseToken}_prices`)
    .doc(time.unix.toString())
    .set({
      time: time.unix,
      price: body.USD,
      [`six_per_${baseToken}`]: price,
      time_string: time.string
    });
}

exports.monitorETH = functions.pubsub
  .topic("monitor-eth")
  .onPublish(() => Promise.resolve(EthereumService.monitor()));

exports.monitorXLM = functions.pubsub
  .topic("monitor-xlm")
  .onPublish(stellarService);

exports.logsUserTable = functions.firestore
  .document("users/{userId}")
  .onWrite(event => {
    const document = event.data.exists ? event.data.data() : null;
    const timestamp = Date.now();
    const oldDocument = event.data.previous.data();
    return admin
      .database()
      .ref(`logs/${timestamp}`)
      .set({ document, oldDocument });
  });

function genKycReadyEmail({ email }) {
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
    resolve(mailOptions);
  });
}

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };

var sendEmail = (function() {
  var _ref = _asyncToGenerator(
    /*#__PURE__*/ regeneratorRuntime.mark(function _callee(emails) {
      var _iteratorNormalCompletion,
        _didIteratorError,
        _iteratorError,
        _iterator,
        _step,
        email,
        mailOptions,
        result,
        path;

      return regeneratorRuntime.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 3;
                _iterator = emails[Symbol.iterator]();

              case 5:
                if (
                  (_iteratorNormalCompletion = (_step = _iterator.next()).done)
                ) {
                  _context.next = 20;
                  break;
                }

                email = _step.value;
                _context.next = 9;
                return genKycReadyEmail({ email: email });

              case 9:
                mailOptions = _context.sent;
                _context.next = 12;
                return mailTransport.sendMail(mailOptions);

              case 12:
                result = _context.sent;
                _context.next = 15;
                return Date.now();

              case 15:
                path = _context.sent;

                admin
                  .firestore()
                  .collection("send_email_logs")
                  .doc(path.toString())
                  .set(
                    _extends({ to: email }, result, { timestamp: Date.now() })
                  );

              case 17:
                _iteratorNormalCompletion = true;
                _context.next = 5;
                break;

              case 20:
                _context.next = 26;
                break;

              case 22:
                _context.prev = 22;
                _context.t0 = _context["catch"](3);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 26:
                _context.prev = 26;
                _context.prev = 27;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 29:
                _context.prev = 29;

                if (!_didIteratorError) {
                  _context.next = 32;
                  break;
                }

                throw _iteratorError;

              case 32:
                return _context.finish(29);

              case 33:
                return _context.finish(26);

              case 34:
              case "end":
                return _context.stop();
            }
          }
        },
        _callee,
        this,
        [[3, 22, 26, 34], [27, , 29, 33]]
      );
    })
  );

  return function sendEmail(_x) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) {
  return function() {
    var gen = fn.apply(this, arguments);
    return new Promise(function(resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function(value) {
              step("next", value);
            },
            function(err) {
              step("throw", err);
            }
          );
        }
      }
      return step("next");
    });
  };
}

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
  cors(req, res, () => {});
  console.log(req.body, "req.body....");
  const { emails, password } = req.body;
  let finish = [];
  let fail = [];
  if (password === "ineedtosendemail") {
    sendEmail(emails);
    res.json({ success: true });
  } else {
    return res.status(400).json(new Error("Password not match"));
  }
});

exports.autoSendKycReadyEmail = functions.firestore
  .document("/users/{userId}")
  .onUpdate(event => {
    console.log(event.data.kyc_status);
    const document = event.data.exists ? event.data.data() : null;
    const oldDocument = event.data.previous.data();
    if (
      document.kyc_status === "approved" &&
      !oldDocument.kyc_status !== "approved"
    ) {
      console.log(`Send pro-ico email to : ${document.email}`);
      return genKycReadyEmail({ email: document.email }).then(mailOptions => {
        return mailTransport
          .sendMail(mailOptions)
          .then(result => {
            console.log(result, "result");
            return result;
          })
          .catch(err => {
            console.log(err);
            return err;
          });
      });
    }
  });

  function genReminderEmail(emails) {
    return new Promise((resolve, reject) => {
      let personalizations = []
      emails.forEach(email => {
        if (email && email.email !== null) {
          personalizations.push({
            "to": [{ email: email.email }],
            "subject": "SIX.network - Don't forget to submit your document"
          })
        }
      })
      const mailOptions = {
        personalizations,
        from: {email: 'no-reply@six.network'},
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
          <div class="footer" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);text-align: center;padding: 20px;margin-top: 50px">
              <span class="credit" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px">© Copyright Media Maxx Advertising</span>
          </div>
        </div>
      </div>
      `
      }]
    }
      resolve(mailOptions);
    });
  }


function sendRemindEmails ({ remind_status, email, doc, db, new_remind_status }) {
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


function updateRemindStatus (users) {
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
  cors(request, response, () => {});
  const db = admin.firestore().collection("users");
  const { password } = request.query
  if (password === "ineedtosendemail") {
    db.get().then(docs => {
      let emailsList = []
      let sendList = []
      docs.forEach(doc => {
        const user = doc.data();
        const { remind_status, email, kyc_status, last_send_remind } = user;
        if (kyc_status === 'not_complete') {
          if (remind_status && last_send_remind) {
            const diff = moment(new Date()).diff(moment(new Date(parseInt(last_send_remind))), 'days')
            switch (remind_status) {
              case 'd1':
                if (diff >= 4) sendList.push({ email, remind_status, new_remind_status: 'd4', id: doc.id })
                break;
              case 'd4':
                if (diff >= 4) sendList.push({ email, remind_status, new_remind_status: 'd8', id: doc.id })
                break;
              case 'd8':
                if (diff >= 7) sendList.push({ email, remind_status, new_remind_status: 'd8+7', id: doc.id })
                break;
              case 'd8+7':
                if (diff >= 14) sendList.push({ email, remind_status, new_remind_status: 'd8+7(2)', id: doc.id })
                break;
              case 'd8+7(2)':
                if (diff >= 21) sendList.push({ email, remind_status, new_remind_status: 'd8+7(3)', id: doc.id })
                break;
              default:
                break;
            }
          } else {
            sendList.push({ email, remind_status, new_remind_status: 'd1', id: doc.id })
          }
        }
      });
      if (sendList && sendList.length > 0) {
        updateRemindStatus(sendList, db)
        return genReminderEmail(sendList)
        .then(mailOptions => {
          return axios.post('https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: 'Bearer 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'}})
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
    });
  } else {
    return response.status(400).json(new Error("Password not match"));
  }
});

exports.createClaim = functions.https.onCall(handleCreateStellarAccount)
exports.claimSix = functions.https.onCall(handleClaimSix)
