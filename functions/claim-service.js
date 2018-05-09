const functions = require('firebase-functions')
const StellarSdk = require('stellar-sdk')
const admin = require('firebase-admin')
const db = admin.firestore()
const claimRef = db.collection('users_claim')

let stellarUrl
if (functions.config().campaign.is_production === 'true') {
  stellarUrl = 'https://horizon.stellar.org'
  StellarSdk.Network.usePublicNetwork()
} else {
  stellarUrl = 'https://horizon-testnet.stellar.org'
  StellarSdk.Network.useTestNetwork()
}

const server = new StellarSdk.Server(stellarUrl)

const distKey = StellarSdk.Keypair.fromSecret(
  functions.config().xlm.ico_distributor_secret
)
const ASSET_CODE = 'SIX'
const sixAsset = new StellarSdk.Asset(ASSET_CODE, functions.config().xlm.issuer_public)

const startingBalance = '2.5'

const handleCreateStellarAccount = (req, res) => {
  if (!distKey) {
    return res.status(503).json({
      error: 'not yet config stellar params'
    })
  }

  const uid = req.body.uid
  const publicKey = req.body.public_key

  if (!uid || !publicKey) {
    return res.status(402).json({
      error: 'Invalid Request'
    })
  }

  return setPublicKey({
    uid,
    public_key: publicKey
  })
    .then(createStellarAccount)
    .then(updateUserCreatedAccount)
    .then(() => {
      return res.status(200).json({
        done: true
      })
    })
    .catch(error => {
      console.log(error)
      return res.status(503).json({
        'error': error.message
      })
    })
}

const setPublicKey = ({ uid, public_key: publicKey }) => {
  // @TODO check is users exists?
  // @TODO check is users_claim exists?
  return claimRef
    .doc(uid)
    .update({
      'public_key': publicKey
    })
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

    transaction.sign(distKey)
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

  return server
    .loadAccount(distKey.publicKey())
    .then(createTransaction)
    .then(submitTransaction)
}

const updateUserCreatedAccount = ({ uid }) => {
  return claimRef
    .doc(uid)
    .update({
      'sent_xlm': true
    })
}

const handleClaimSix = (req, res) => {
  if (!distKey) {
    return res.status(503).json({
      error: 'not yet config stellar params'
    })
  }

  const uid = req.body.uid
  const claimId = req.body.claim_id

  if (!uid || !claimId) {
    return res.status(402).json({
      error: 'Invalid Request'
    })
  }

  findUser({
    uid,
    claim_id: claimId
  })
    .then(findClaim)
    .then(sendSix)
    .then(updateClaim)
    .then(() => {
      return res.status(200).json({
        done: true
      })
    })
    .catch(error => {
      console.log(error)
      return res.status(503).json({
        'error': error.message
      })
    })
}

function findUser ({ uid, claim_id: claimId }) {
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

    sendTransaction.sign(distKey)
    return {
      uid,
      claim,
      claim_id: claimId,
      user,
      send_transaction: sendTransaction
    }
  }

  function submitTransaction ({
    uid,
    claim,
    claim_id: claimId,
    user,
    send_transaction: sendTransaction
  }) {
    return server.submitTransaction(sendTransaction).then(() => {
      return {
        uid,
        claim,
        claim_id: claimId,
        user
      }
    })
  }

  return server
    .loadAccount(distKey.publicKey())
    .then(createTransaction)
    .then(submitTransaction)
}

const updateClaim = ({ uid, claim, claim_id: claimId, user }) => {
  return claimRef
    .doc(uid)
    .collection('claim_period')
    .doc(claimId)
    .update({
      claimed: true
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

module.exports = {
  handleCreateStellarAccount,
  handleClaimSix
}
