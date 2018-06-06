const functions = require('firebase-functions')
const StellarSdk = require('stellar-sdk')
const request = require('request-promise')
const admin = require('firebase-admin')
const db = admin.firestore()
const claimRef = db.collection('users_claim')
const userRef = db.collection('users')
const claimPoolsRef = db.collection('claim_pools')
const claimLogRef = db.collection('claim_tx_logs')
const lockPoolsRef = db.collection('lock_pool').doc('process')

let stellarUrl
const secondaryClaimUrl = functions.config().secondary_signer.url + '/setPublicKey'
const secondarySignerUrl = functions.config().secondary_signer.url + '/handleSignSix'

if (functions.config().campaign.is_production === 'true') {
  stellarUrl = 'https://horizon.stellar.org'
  StellarSdk.Network.usePublicNetwork()
} else {
  stellarUrl = 'https://horizon-testnet.stellar.org'
  StellarSdk.Network.useTestNetwork()
}

const server = new StellarSdk.Server(stellarUrl)

const multiSigAddress = functions.config().xlm.multi_sig_address
// for claim six
const firstSignerKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.first_signer_secret
)

// for create account
const accountCreatorKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.account_creator_secret
)

const ASSET_CODE = 'SIX'
const sixAsset = new StellarSdk.Asset(ASSET_CODE, functions.config().xlm.issuer_public)

const startingBalance = '2.0'

const handleCreateStellarAccount = (data, context) => {
  if (!accountCreatorKey) {
    return {
      success: false,
      error_message: 'not yet config stellar params'
    }
  }

  const uid = context.auth.uid
  const publicKey = data.public_key

  if (!uid || !publicKey) {
    return {
      success: false,
      error_message: 'Invalid Request'
    }
  }

  return setPublicKey({
    uid,
    public_key: publicKey
  })
    .then(setPublicKeyToSecondaryServer)
    .then(createStellarAccount)
    .then(updateUserWalletAccount)
    .then(updateUserCreatedAccount)
    .then(() => {
      return {
        success: true
      }
    })
    .catch(error => {
      console.log(error)
      return {
        success: true,
        error_message: error.message
      }
    })
}

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

const setPublicKey = ({ uid, public_key: publicKey }) => {
  // @TODO check is users exists?
  // @TODO check is users_claim exists?
  return claimRef
    .doc(uid)
    .set({
      'public_key': publicKey
    }, { merge: true })
    .then(() => {
      return {
        uid,
        public_key: publicKey
      }
    })
}

const createStellarAccount = ({ uid, public_key: publicKey }) => {
  function createTransaction (distributorAccount) {
    const transaction = new StellarSdk.TransactionBuilder(distributorAccount)
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: publicKey,
          startingBalance
        })
      )
      .build()

    transaction.sign(accountCreatorKey)
    return {
      uid,
      public_key: publicKey,
      transaction
    }
  }

  function submitTransaction ({ uid, public_key: publicKey, transaction }) {
    return server.submitTransaction(transaction).then(() => {
      return {
        uid,
        public_key: publicKey
      }
    })
  }
  return server.loadAccount(publicKey).then(an_account => {
    if (!checkBalanceForTrust(an_account)) {
      return server
        .loadAccount(accountCreatorKey.publicKey())
        .then(createTransaction)
        .then(submitTransaction)
    } else {
      return { uid, public_key: publicKey }
    }
  }).catch(() => {
    return server
      .loadAccount(accountCreatorKey.publicKey())
      .then(createTransaction)
      .then(submitTransaction)
  })
}

const updateUserWalletAccount = ({ uid, public_key }) => {
  return userRef
    .doc(uid)
    .set({
      submit_xlm_wallet: true,
      xlm_address: public_key
    }, { merge: true }).then(() => {
      return {
        uid,
        public_key
      }
    })
}

const updateUserCreatedAccount = ({ uid }) => {
  return claimRef
    .doc(uid)
    .set({
      'sent_xlm': true
    }, { merge: true })
}

const createPool = ({ uid, claim_id: claimId }) => {
  const data = {
    uid,
    claim_id: claimId,
    timestamp: new Date().getTime()
  }
  return claimPoolsRef
    .doc(`${uid}_${claimId}`)
    .create(data)
    .then(() => {
      return {
        uid,
        claim_id: claimId
      }
    })
}

const deleteClaimIdInPool = (body) => {
  const { uid, claim_id: claimId } = body
  const claimPoolsId = `${uid}_${claimId}`

  return claimPoolsRef
    .doc(claimPoolsId)
    .delete()
    .then(() => {
      return body
    })
    .catch(e => {
      console.error('Error removing document: ', e)
      return body
    })
}

function setClaimTxLog (data) {
  return claimLogRef.doc().set(data)
}

function sendClaimUpdateEmail (email, amount, total) {
    const content = `
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
          <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Your Total Balance: ${balance} SIX tokens</p>
          <p style="margin-bottom: 10px; margin-top: 10px;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Furthermore, you can review your transaction by logging to the system at:
          <a href=" https://ico.six.network"> https://ico.six.network</a>
          </p>
          <p style=" margin-top: 10px;font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>Best regards,</p>
          <p style="font-family: &quot;Prompt&quot;, sans-serif;color: rgba(33, 33, 33, 1);font-size: 14px"></p>SIX network team</p>
        </div>
      </div>
    </div>
  </div>
    `
    const personalization = [{
      to: [{ email }],
      subject: '[SIX network] Transaction completed'
    }]
    const mailOptions = {
      personalization,
      from: {email: 'no-reply@six.network'},
      content: [{
        type: 'text/html',
        value: content
      }]
    }
    axios.post('https://cors-anywhere.herokuapp.com/https://api.sendgrid.com/v3/mail/send', mailOptions, { headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`}})
}

/**
 *
 * @param {string} transactionId optional
 */
const updateState = ({ uid, claim, claim_id: claimId, user, state, tx, error }) => {
  console.log('updateState')
  const update_timestamp = Date.now()
  let data = {
    state: state || 1,
    update_timestamp
  }
  if (tx) {
    data.transaction_id = tx.hash
    data.transaction_result = tx
  }
  if (error && error.message) {
    data.error_message = error.message
  }

  const userClaimRef = claimRef.doc(uid).collection('claim_period').doc(string(claimId))
  let public_key = ''
  let email = ''
  let current_amount = 0
  return userClaimRef
    .update(data)
    .then(() => {
      if (data.state > 1) {
        return setClaimTxLog(Object.assign({ uid, claim_id: claimId, is_error: !!data.error_message }, data)
        )
      }
    })
    .then(() => claimRef.doc(uid).get())
    .then(snapshot => snapshot.data())
    .then(userClaimData => {
      public_key = userClaimData.public_key
      return public_key
    })
    .then(() => userRef(uid).get())
    .then(snapshot => snapshot.data())
    .then(userData => {
      email = userData.email
      return email
    })
    .then(() => userClaimRef.get())
    .then(snapshot => snapshot.data())
    .then(userClaimRefData => {
      const { amount } = userClaimRefData
      current_amount = amount
      return amount
    })
    .then(() => claimRef.doc(uid).collection('claim_period').get())
    .then(snapshots => {
      if (snapshots && snapshots.length > 0) {
        let total_claim = 0
        snapshots.forEach(snapshot => {
          const data = snapshot.data()

          total_claim += data.amount && data.amount !== null ? data.amount : 0
        })
        return sendClaimUpdateEmail(email, current_amount, total_claim)
      }
    })
    .then()
    .then(() => {
      return {
        uid,
        claim,
        claim_id: claimId,
        user
      }
    })
}

const releasePool = () => lockPoolsRef.set({is_lock: false})

const lockPool = ({ uid, claim_id: claimId }) => {
  return db.runTransaction(t => {
    return t.get(lockPoolsRef).then(doc => {
      // @TODO  create document if not intial lock process
      if (doc.exists) {
        const lockStatus = doc.data()
        if (lockStatus.is_lock) {
          return {
            uid,
            claim_id: claimId,
            lock_successful: false
          }
        }
      }
      t.update(lockPoolsRef, { is_lock: true, lock_id: `${uid}_${claimId}`, lock_time: new Date().toString() })
      return {
        uid,
        claim_id: claimId,
        lock_successful: true
      }
    })
  })
}

const processNewClaimPool = () => {
  return claimPoolsRef
    .orderBy('timestamp')
    .limit(1)
    .get()
    .then((snap) => {
      if (snap.docs.length > 0) {
        return snap.docs[0].data()
      }
    })
    .then(claimData => {
      if (claimData) {
        return lockPool(claimData)
      }
      return {
        lock_successful: false
      }
    })
    .then(lockInfo => {
      if (lockInfo.lock_successful) {
        handleClaimSix({ claim_id: lockInfo.claim_id }, { auth: { uid: lockInfo.uid } })
          .then(processNewClaimPool)
      }
    })
}

/**
 * create job on claim_pools.
 * @param {string} uid
 * @param {string} claimId
 */
const claimSixByCreatePool = (uid, claimId) => {
  return findClaim({
    uid,
    claim_id: claimId
  })
    .then(createPool)
    .then(updateState)
    .then(() => {
      processNewClaimPool()
    })
    .then(() => {
      return {
        success: true
      }
    })
    .catch(error => {
      console.log(error)
      return {
        success: false,
        error_message: error.message
      }
    })
}

const handleClaimSix = (data, context) => {
  if (!firstSignerKey) {
    return {
      success: false,
      error_message: 'not yet config stellar params'
    }
  }

  const uid = context.auth.uid
  const claimId = data.claim_id

  if (!uid || !claimId) {
    return {
      success: false,
      error_message: 'Invalid Request'
    }
  }

  return findUser({
    uid,
    claim_id: claimId
  })
    .then(findClaim)
    .then(sendSix)
    .then(updateClaim)
    .then(deleteClaimIdInPool)
    .then((body) => {
      Object.assign(body, {
        state: 2
      })
      return updateState(body)
    })
    .then(releasePool)
    .then(() => {
      return { success: true }
    })
    .catch(error => {
      console.log(error)
      return deleteClaimIdInPool({ uid, claim_id: claimId })
        .then((body) => {
          Object.assign(body, {
            state: 3,
            error
          })
          return updateState(body)
        })
        .then(releasePool)
        .then(() => ({ success: false, error_message: error.message }))
    })
}

function findUser ({ uid, claim_id: claimId }) {
  console.log('find user')
  return claimRef
    .doc(uid)
    .get()
    .then(user => {
      if (user.exists) {
        return {
          uid,
          claim_id: claimId,
          user: user.data()
        }
      }
      return Promise.reject(new Error('User not found'))
    })
}

function findClaim ({ uid, claim_id: claimId, user }) {
  return claimRef
    .doc(uid)
    .collection('claim_period')
    .doc(claimId)
    .get()
    .then(claim => {
      if (claim.exists) {
        const claimData = claim.data()

        const currentTime = new Date().getTime()
        if (currentTime < claimData.valid_after) {
          return Promise.reject(new Error('Claim is not ready'))
        }

        if (claimData.state !== 1 && claimData.state !== undefined) {
          return Promise.reject(new Error('State is existing, already claim even it error'))
        }

        return claimData.claimed === true
          ? Promise.reject(new Error('User already claimed.'))
          : {
            uid,
            claim: claimData,
            claim_id: claimId,
            user
          }
      }
      return Promise.reject(new Error('User not found'))
    })
}

function sendSix ({ uid, claim_id: claimId, user, claim }) {
  console.log('sendSix')
  function createTransaction (distributorAccount) {
    const sendTransaction = new StellarSdk.TransactionBuilder(
      distributorAccount
    )
      .addOperation(
        StellarSdk.Operation.payment({
          destination: user.public_key,
          amount: claim.amount.toString(),
          asset: sixAsset
        })
      )
      .build()

    sendTransaction.sign(firstSignerKey)
    return {
      uid,
      claim,
      claim_id: claimId,
      user,
      send_transaction: sendTransaction
    }
  }

  function sendTxToSecondarySigner ({ uid, claim, claim_id: claimId, user, send_transaction: sendTransaction }) {
    const xdr = sendTransaction.toEnvelope().toXDR('base64')
    return request({
      uri: secondarySignerUrl,
      method: 'POST',
      body: {
        uid,
        claim_id: claimId,
        xdr
      },
      json: true
    }).then(body => body.error ? Promise.reject(new Error(body.error))
      : {
        uid,
        claim,
        claim_id: claimId,
        user,
        send_transaction: new StellarSdk.Transaction(body.new_xdr)
      })
  }

  function submitTransaction ({ uid, claim, claim_id: claimId, user, send_transaction: sendTransaction }) {
    return server.submitTransaction(sendTransaction).then((tx) => {
      return {
        uid,
        claim,
        claim_id: claimId,
        user,
        tx
      }
    })
  }

  return server.loadAccount(multiSigAddress)
    .then(createTransaction)
    .then(sendTxToSecondarySigner)
    .then(submitTransaction)
}

const updateClaim = ({ uid, claim, claim_id: claimId, user, tx }) => {
  console.log('updateClaim')
  return claimRef
    .doc(uid)
    .collection('claim_period')
    .doc(String(claimId))
    .update({
      claimed: true
    })
    .then(() => {
      return {
        uid,
        claim,
        claim_id: claimId,
        user,
        tx
      }
    })
}

module.exports = {
  handleCreateStellarAccount,
  handleClaimSix,
  claimSixByCreatePool,
  findUser,
  findClaim,
  sendSix,
  updateClaim
}

const checkBalanceForTrust = (distributorAccount) => {
  let balancesCount = (distributorAccount.balances.length - 1)
  let leastXLM = (balancesCount * 0.5) + 2
  let xlmBlance = distributorAccount.balances.filter(balance => {
    if (balance.asset_type === 'native') {
      return true
    }
  })[0].balance
  if (parseFloat(xlmBlance) > leastXLM) {
    return true
  } else {
    return false
  }
}
