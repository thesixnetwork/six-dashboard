const axios = require('axios')
const path = '/users_claim/{uid}/claim_period/{claim_id}'
const SENDGRID_API_KEY = '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'
const line = require('@line/bot-sdk')
const pool = require('../claim-service').poolUtilities

module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [
    {
      'name': 'sendClaimedEmail',
      'module': events.onUpdate(event => sendClaimedEmail(event, fireStore))
    },
    {
      'name': 'monitorClaimError',
      'module': events.onUpdate(event => monitorClaimError(event, fireStore))
    },
    {
      'name': 'monitorLockPool',
      'module': functions.pubsub.topic('monitorLockPool').onPublish(event => monitorLockPool(event, fireStore))
    }
  ]
}

const lineConfig = {
  channelAccessToken: 'C4LsZsncr1GqIG+sq3vpoH/crHJCc+EvtGptC0zHSmcu2I1RBlspnzMGhBd81G7wHIrbVHiG+JxCROy/3tpMq5wroHMfXjePXGiRsmMZRICs8DEswKOEfxhsV6IwShOohMY5JpeFEfSui+Z50RZBngdB04t89/1O/w1cDnyilFU=',
  channelSecret: '2d19ced6a3b7bf8fe8945591da1ab3b7',
  groupId: 'C3e196a4b31d7dc3de626303259335ded'
}
const client = new line.Client(lineConfig)
const timeoutAlert = 120000 // 2 minute
const sendLineAlert = (text) => {
  client.pushMessage(lineConfig.groupId, {
    type: 'text',
    text
  })
}

function monitorLockPool (event, fireStore) {
  return fireStore
    .collection('lock_pool')
    .doc('process')
    .get()
    .then(snapshot => {
      const pool = snapshot.data()
      if (pool.is_lock === false) {
        return Promise.resolve()
      }
      const lockTime = new Date(pool.lock_time).getTime()
      const now = new Date().getTime()
      const isTimeout = (now - lockTime) > timeoutAlert
      return isTimeout ? handleLockPoolStuck(fireStore, pool) : Promise.resolve()
    })
}

function handleLockPoolStuck (fireStore, lockPool) {
  const uid = lockPool.lock_id.split('_')[0]
  const claimId = lockPool.lock_id.split('_')[1]
  const lockTime = lockPool.lock_time
  sendLineAlert(
    `process stuck more than ${timeoutAlert / 60000} min. \n uid: ${uid} \n claim_id: ${claimId} \n lock_time: ${lockTime}`
  )
  return pool
    .deleteClaimIdInPool({ uid, claim_id: claimId })
    .then(pool.releasePool)
    .then(pool.processNewClaimPool)
    .then(fireStore
      .collection('stuck_pool')
      .doc()
      .set({uid, claim_id: claimId, lock_time: lockTime})
    )
}

function monitorClaimError (event, fireStore) {
  const previousUserData = event.data.previous.data()
  const updateData = event.data.data()
  if (updateData.state === 3 && previousUserData.state === 1) {
    const uid = event.params.uid
    const claimId = event.params.claim_id
    sendLineAlert(
      `Claim Error!
      ${updateData.error_message}

      uid: ${uid}
      claim_id: ${claimId}
      `)
  }
  return Promise.resolve()
}

function sendClaimedEmail (event, fireStore) {
  const previousUserData = event.data.previous.data()
  const updateData = event.data.data()
  if (updateData.state === 2 && previousUserData.state === 1) {
    const uid = event.params.uid
    const claimId = event.params.claim_id
    const claimRef = fireStore.collection('users_claim')
    const userClaimRef = claimRef.doc(uid).collection('claim_period').doc(String(claimId))
    const userRef = fireStore.collection('users').doc(uid)
    let email = ''
    let currentAmount = 0
    return userRef.get()
      .then(snapshot => { email = snapshot.data().email })
      .then(() => userClaimRef.get())
      .then(snapshot => snapshot.data())
      .then(userClaimRefData => {
        currentAmount = userClaimRefData.amount
      })
      .then(() => claimRef.doc(uid).collection('claim_period').get())
      .then(snapshots => {
        let totalClaim = 0
        snapshots.forEach(snapshot => {
          const data = snapshot.data()
          if (data.claimed) totalClaim += data.amount
        })
        console.log(`send email ${email} of uid: ${uid}`)
        return sendClaimUpdateEmail(email, currentAmount, totalClaim, updateData.transaction_id)
      })
  }
  return Promise.resolve()
}

function sendClaimUpdateEmail (email, amount, total, tx_id) {
  const content = `
        <table bgcolor="#fdfdfd" class="m_-5711629866739327851body" style="box-sizing:border-box;border-spacing:0;width:100%;background-color:#fdfdfd;border-collapse:separate!important"
          width="100%">

          <tbody>

            <tr>

              <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                valign="top">&nbsp;</td>

              <td class="m_-5711629866739327851container" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;display:block;width:600px;max-width:600px;margin:0 auto!important"
                valign="top" width="600">

                <div class="m_-5711629866739327851content" style="box-sizing:border-box;display:block;max-width:600px;margin:0 auto;padding:10px">
                  <div class="m_-5711629866739327851header" style="box-sizing:border-box;width:100%;margin-bottom:30px;margin-top:15px">

                    <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">

                      <tbody>

                        <tr>

                          <td align="left" class="m_-5711629866739327851align-left" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;text-align:left"
                            valign="top">
                            <span class="m_-5711629866739327851sg-image">
                              <a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none"
                                target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1528351184400000&amp;usg=AFQjCNF-tBWcvdsEZArFX4pYZ2Wl0TOKbQ">
                                <img alt="SendGrid" height="60" src="https://firebasestorage.googleapis.com/v0/b/six-dashboard.appspot.com/o/public%2FScreen%20Shot%202561-06-06%20at%2013.25.20.png?alt=media&token=f746cd50-5c86-45b9-83e4-16c7d77195c6"
                                  style="max-width:100%;border-style:none;width:123px;height:60px" width="123" class="CToWUd">
                              </a>
                            </span>
                          </td>

                        </tr>

                      </tbody>

                    </table>

                  </div>



                  <div class="m_-5711629866739327851block" style="box-sizing:border-box;width:100%;margin-bottom:30px;background:#ffffff;border:1px solid #f0f0f0">

                    <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">

                      <tbody>

                        <tr>

                          <td class="m_-5711629866739327851wrapper" style="box-sizing:border-box;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;padding:30px"
                            valign="top">

                            <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">

                            <tbody>

                            <tr>

                              <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                                valign="top">
                                <h3 style="margin:0;margin-bottom:30px;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;line-height:1.5;font-size:24px;color:#294661!important">You successfully claimed the SIX token with the following details: </h3>
                                <p style="margin:0;margin-bottom:20px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">Transaction ID (TX Hash): ${tx_id}</p>
                                <p style="margin:0;margin-bottom:20px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">Claim Amount: ${amount} SIX tokens</p>
                                <p style="margin:0;margin-bottom:20px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">Your Total Balance: ${total} SIX tokens</p>
                                <p style="margin:0;margin-bottom:20px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">Furthermore, you can review your transaction by logging to the system at:
      <a href=" https://ico.six.network"> https://ico.six.network</a></p>
                                <p style="margin:0;margin-bottom:10px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">Best regards,</p>
                                <p style="margin:0;margin-bottom:20px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">SIX network team</p>
                              </td>

                            </tr>

                            <tr>

                              <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                                valign="top">

                                <table cellpadding="0" cellspacing="0" class="m_-5711629866739327851btn m_-5711629866739327851btn-primary" style="box-sizing:border-box;border-spacing:0;width:100%;border-collapse:separate!important"
                                  width="100%">

                                  <tbody>

                                    <tr>

                                      <td align="center" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;padding-bottom:15px"
                                        valign="top">

                                        <table cellpadding="0" cellspacing="0" style="box-sizing:border-box;border-spacing:0;width:auto;border-collapse:separate!important">

                                          <tbody>

                                            <tr>

                                              <td align="center" bgcolor="#348eda" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;background-color:#348eda;border-radius:2px;text-align:center"
                                                valign="top">
                                              </td>

                                            </tr>

                                          </tbody>

                                        </table>

                                      </td>

                                    </tr>

                                  </tbody>

                                </table>

                              </td>

                            </tr>

                          </tbody>

                            </table>

                          </td>

                        </tr>

                      </tbody>

                    </table>

                  </div>



                  <div class="m_-5711629866739327851footer" style="box-sizing:border-box;clear:both;width: 100% !important;">

                    <table style="box-sizing:border-box;width:100%;border-spacing:0;font-size:12px;border-collapse:separate!important" width="100%">

                      <tbody style="width: 100% !important;">

                        <tr style="font-size:12px" style="width: 100% !important;">

                          <td align="center" class="m_-5711629866739327851align-center" style="width: 100% !important;box-sizing:border-box;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;vertical-align:top;font-size:12px;text-align:center;padding:20px 0"
                            valign="top">
                            <span class="m_-5711629866739327851sg-image" style="float:none;display:block;text-align:center">
                              <a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px"
                                target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1528351184401000&amp;usg=AFQjCNGOAsoVqskiqeWIVPGSEobWbRw45w">
                                <img alt="SendGrid" height="40" src="https://firebasestorage.googleapis.com/v0/b/six-dashboard.appspot.com/o/public%2FScreen%20Shot%202561-06-06%20at%2013.25.20.png?alt=media&token=f746cd50-5c86-45b9-83e4-16c7d77195c6"
                                  style="max-width:100%;border-style:none;font-size:12px;width:89px;height:40px" width="89" class="CToWUd">
                              </a>
                            </span>

                            <p style="margin-top: 10px; margin-bottom: 10px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;font-size:12px;margin-bottom:5px">©
                              <span class="il">2018 SIX Network PTE. LTD.</span>
                            </p>



                            <p style="margin:0;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;font-size:12px;margin-bottom:5px">
                              <a href=" https://medium.com/six-network" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                                target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q= https://medium.com/six-network">Medium</a>
                              <a href=" https://t.me/SIXNetwork" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                                target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://t.me/SIXNetwork">Telegram</a>
                              <a href=" https://twitter.com/theSIXnetwork" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                                target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://twitter.com/theSIXnetwork">Twitter</a>
                              <a href="https://www.facebook.com/thesixnetwork" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                                target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://www.facebook.com/thesixnetwork">Facebook</a>
                            </p>

                          </td>

                        </tr>

                      </tbody>

                    </table>

                  </div>

                </div>

              </td>

              <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                valign="top">&nbsp;</td>

            </tr>

          </tbody>

        </table>
  `
  const personalizations = [{
    to: [{ email }],
    subject: '[SIX network] Transaction completed'
  }]
  const mailOptions = {
    personalizations,
    from: {email: 'no-reply@six.network'},
    content: [{
      type: 'text/html',
      value: content
    }]
  }
  axios.post('https://api.sendgrid.com/v3/mail/send',
    mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` } })
}
