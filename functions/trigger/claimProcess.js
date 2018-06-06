const axios = require('axios')
const path = '/users_claim/{uid}/claim_period/{claim_id}'
const SENDGRID_API_KEY = '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'

module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [
    {
      'name': 'sendClaimedEmail',
      'module': events.onUpdate(event => sendClaimedEmail(event, fireStore))
    }
  ]
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
        return sendClaimUpdateEmail(email, currentAmount, totalClaim)
      })
  }
  return Promise.resolve()
}

function sendClaimUpdateEmail (email, amount, total) {
  const content = `
<html lang="en" style="margin: 0; outline: none; padding: 0;">
    <body>
    <div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);margin: 0;">
    <div className="section" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);position: relative;padding-bottom: 10px;height: 100%;z-index: 1">
      <!-- <img className="top-header" src="https://firebasestorage.googleapis.com/v0/b/devson-f46f4.appspot.com/o/public%2Fheader.png?alt=media&token=9f32b7f1-6def-45f2-bf1a-2cea15326450"
              alt=""> -->
      <div className="card-content" style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 5px;margin-top: -20px;transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);background: #FFF">
        <div style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);padding: 2%">
          <!-- thai -->
          <p style="margin-bottom: 10px;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 17px">You successfully claimed the SIX token with the following details:</h2>
            <br />
            <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Transaction ID (TX Hash): r23Hdk4j3k4oj4t3DFG2DFSD</p>
          <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Claim Amount: ${amount} SIX tokens</p>
          <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Your Total Balance: ${total} SIX tokens</p>
          <p style="margin-bottom: 10px; margin-top: 10px;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Furthermore, you can review your transaction by logging to the system at:
          <a href=" https://ico.six.network"> https://ico.six.network</a>
          </p>
          <p style=" margin-top: 10px;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Best regards,</p>
          <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>SIX network team</p>
        </div>
      </div>
    </div>
  </div>
    </body>
</html>
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
