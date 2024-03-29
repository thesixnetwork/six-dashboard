const StellarSdk = require('stellar-sdk')
const request = require('request-promise')
const LogTracker = require('logtracker')
const { functions, fireStore } = require('./index')

const db = fireStore
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
  const logger = new LogTracker()
  logger.track('setPublicKey')
  return setPublicKey({
    uid,
    public_key: publicKey
  })
    .then(r => {
      logger.track('createStellarAccount')
      return r
    })
    .then(createStellarAccount)
    .then(r => {
      logger.track('updateUserWalletAccount')
      return r
    })
    .then(updateUserWalletAccount)
    .then(r => {
      logger.track('updateUserCreatedAccount')
      return r
    })
    .then(updateUserCreatedAccount)
    .then(() => {
      console.log(JSON.stringify(logger.trace(), null, 2))
      logger.done()
      return {
        success: true
      }
    })
    .catch(error => {
      console.log(error)
      console.log(JSON.stringify(logger.trace(), null, 2))
      logger.done()
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

/**
 *
 * @param {string} transactionId optional
 */
const updateState = ({ uid, claim, claim_id: claimId, user, state, tx, error }) => {
  console.log('updateState')
  const updateTimestamp = Date.now()
  let data = {
    state: state || 1,
    update_timestamp: updateTimestamp
  }
  if (tx) {
    data.transaction_id = tx.hash
    data.transaction_result = tx
  }
  if (error && error.message) {
    data.error_message = error.message
  }

  const userClaimRef = claimRef.doc(uid).collection('claim_period').doc(String(claimId))
  return userClaimRef
    .update(data)
    .then(() => {
      if (data.state > 1) {
        return setClaimTxLog(Object.assign({ uid, claim_id: claimId, is_error: !!data.error_message }, data)
        )
      }
    })
    .then(() => {
      return {
        uid,
        claim,
        claim_id: claimId,
        user
      }
    })
}

const releasePool = () => lockPoolsRef.set({ is_lock: false })

const lockPool = ({ uid, claim_id: claimId }) => {
  return db.runTransaction(t => {
    return t.get(lockPoolsRef).then(doc => {
      // @TODO  create document if not intial lock process
      if (doc.exists) {
        const lockStatus = doc.data()
        if (lockStatus.is_lock) {
          return Promise.resolve({
            uid,
            claim_id: claimId,
            lock_successful: false
          })
        }
      }
      t.update(lockPoolsRef, { is_lock: true, lock_id: `${uid}_${claimId}`, lock_time: new Date().toString() })
      return Promise.resolve({
        uid,
        claim_id: claimId,
        lock_successful: true
      })
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

  const logger = new LogTracker({
    timeout: 90000 // log if process time beyone 1 min 30 sec.
  })
  logger.track('findUser')
  return findUser({
    uid,
    claim_id: claimId
  })
    .then(r => {
      logger.track('findClaim')
      return r
    })
    .then(findClaim)
    .then(r => {
      logger.track('sendSix')
      return r
    })
    .then(sendSix)
    .then(r => {
      logger.track('updateClaim')
      return r
    })
    .then(updateClaim)
    .then(r => {
      logger.track('deleteClaimIdInPool')
      return r
    })
    .then(deleteClaimIdInPool)
    .then(r => {
      logger.track('updateState 2 (success)')
      return r
    })
    .then((body) => {
      Object.assign(body, {
        state: 2
      })
      return updateState(body)
    })
    .then(r => {
      logger.track('releasePool')
      return r
    })
    .then(releasePool)
    .then(() => {
      console.log(JSON.stringify(logger.trace(), null, 2))
      logger.done()
      return { success: true }
    })
    .catch(error => {
      console.log(error)
      logger.track(`${error.toString()} \n then process function deleteClaimIdInPool`)
      return deleteClaimIdInPool({ uid, claim_id: claimId })
        .then(r => {
          logger.track('updateState 3 (failed)')
          return r
        })
        .then((body) => {
          Object.assign(body, {
            state: 3,
            error
          })
          return updateState(body)
        })
        .then(r => {
          logger.track('releasePool')
          return r
        })
        .then(releasePool)
        .then(() => {
          console.log(JSON.stringify(logger.trace(), null, 2))
          logger.done()
          return { success: false, error_message: error.message }
        })
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
          amount: claim.amount.toFixed(7).toString(),
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

  const logger = new LogTracker({
    timeout: 30000 // log if process time beyone 30 sec.
  })
  console.log('load multisix account')
  logger.track('load multisix account')
  return server.loadAccount(multiSigAddress)
    .then(r => {
      console.log('createTransaction')
      logger.track('createTransaction')
      return r
    })
    .then(createTransaction)
    .then(r => {
      console.log('sendTxToSecondarySigner')
      logger.track('sendTxToSecondarySigner')
      return r
    })
    .then(sendTxToSecondarySigner)
    .then(r => {
      console.log('submitTransaction')
      logger.track('submitTransaction')
      return r
    })
    .then(submitTransaction)
    .then(r => {
      console.log(JSON.stringify(logger.trace(), null, 2))
      logger.done()
      return r
    })
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

const poolUtilities = {
  releasePool,
  deleteClaimIdInPool,
  processNewClaimPool
}

module.exports = {
  handleCreateStellarAccount,
  handleClaimSix,
  claimSixByCreatePool,
  findUser,
  findClaim,
  sendSix,
  updateClaim,
  poolUtilities
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
