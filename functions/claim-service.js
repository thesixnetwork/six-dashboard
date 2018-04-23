const functions = require('firebase-functions')
const StellarSdk = require('stellar-sdk')
const admin = require('firebase-admin')
const db = admin.firestore()

let stellarUrl
if (functions.config().campaign.is_production === "true") {
  stellarUrl = 'https://horizon.stellar.org'
  StellarSdk.Network.usePublicNetwork()
} else {
  stellarUrl = 'https://horizon-testnet.stellar.org'
  StellarSdk.Network.useTestNetwork()
}

const server = new StellarSdk.Server(stellarUrl)

const issuerKey = StellarSdk.Keypair.fromSecret(functions.config().xlm.issuer_low_secret)
const distKey = StellarSdk.Keypair.fromSecret(functions.config().xlm.ico_distributor_secret)

const sixAsset = new StellarSdk.Asset('six', issuerKey.publicKey())

const startingBalance = '2.5'

const handleCreateStellarAccount = (req, res) => {
  if (!issuerKey || !distKey) {
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
    }).catch((error) => {
    console.dir(error)
    return res.status(503).json({
      error
    })
  })

}

const setPublicKey = ({uid, public_key: publicKey}) => {
  return db.collection('users').doc(uid).update({
    "claim.public_key": publicKey
  }).then(() => {
    return {
      uid,
      public_key: publicKey
    }
  })
}

const createStellarAccount = ({uid, public_key: publicKey}) => {

  function createTransaction(distributorAccount) {
    const transaction = new StellarSdk.TransactionBuilder(distributorAccount)
      .addOperation(StellarSdk.Operation.createAccount({
        destination: publicKey,
        startingBalance
      }))
      .build()

    transaction.sign(distKey)
    return {
      uid,
      public_key: publicKey,
      transaction
    }
  }

  function submitTransaction({uid, public_key: publicKey, transaction}) {
    return server.submitTransaction(transaction).then(() => {
      return {
        uid,
        public_key: publicKey
      }
    })
  }

  return server.loadAccount(distKey.publicKey())
    .then(createTransaction)
    .then(submitTransaction)
}

const updateUserCreatedAccount = ({uid}) => {
  return db.collection('users').doc(uid).update({
    "claim.sent_xlm": true
  })
}

const handleClaimSix = (req, res) => {
  if (!issuerKey || !distKey) {
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
    .then(allowTrust)
    .then(updateAllowTrust)
    .then(sendSix)
    .then(updateClaim)
    .then(() => {
      return res.status(200).json({
        done: true
      })
    }).catch((error) => {
    console.dir(error)
    return res.status(503).json({
      error
    })
  })
}

function findUser({uid, claim_id}) {
  return db.collection('users').doc(uid).get().then((user) => {
    if (user.exists) {
      return {
        uid,
        claim_id,
        user: user.data()
      }
    }
    return Promise.reject({
      'text': 'User not found'
    })
  })
}

function findClaim({uid, claim_id: claimId, user}) {
  return db.collection('users')
    .doc(uid)
    .collection('claim_period')
    .doc(claimId)
    .get()
    .then((claim) => {
      if (claim.exists) {
        return {
          uid,
          claim: claim.data(),
          claim_id: claimId,
          user
        }
      }
      return Promise.reject({
        'text': 'User not found'
      })
    })
}

function allowTrust({uid, claim_id, user, claim}) {
  function createTransaction(issuerAccount) {
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount)
      .addOperation(StellarSdk.Operation.allowTrust({
        trustor: user.claim.public_key,
        assetCode: 'six',
        authorize: true
      }))
      .build()

    transaction.sign(issuerKey)
    return {
      uid,
      claim,
      claim_id,
      user,
      transaction
    }
  }

  function submitTransaction({uid, public_key: publicKey, transaction}) {
    return server.submitTransaction(transaction).then(() => {
      return {
        uid,
        claim,
        claim_id,
        user,
      }
    })
  }

  return server.loadAccount(issuerKey.publicKey())
    .then(createTransaction)
    .then(submitTransaction)
}

const updateAllowTrust = ({uid, claim, claim_id, user}) => {
  return db.collection('users').doc(uid).update({
    "claim.allow_trust": true
  }).then(() => {
    return {
      uid,
      claim,
      claim_id,
      user,
    }
  })
}

function sendSix({uid, claim_id, user, claim}) {
  function createTransaction(distributorAccount) {
    const sendTransaction = new StellarSdk.TransactionBuilder(distributorAccount)
      .addOperation(StellarSdk.Operation.payment({
        destination: user.claim.public_key,
        amount: claim.amount.toString(),
        asset: sixAsset
      }))
      .build()

    sendTransaction.sign(distKey)
    return {
      uid,
      claim,
      claim_id,
      user,
      send_transaction: sendTransaction
    }
  }

  function submitTransaction({uid, claim, claim_id, user, send_transaction:sendTransaction}) {
    return server.submitTransaction(sendTransaction).then(() => {
      return {
        uid,
        claim,
        claim_id,
        user,
      }
    })
  }

  return server.loadAccount(distKey.publicKey())
    .then(createTransaction)
    .then(submitTransaction)
}

const updateClaim = ({uid, claim, claim_id, user}) => {
  return db.collection('users').doc(uid).collection('claim_period').doc(claim_id).update({
    "claimed": true
  }).then(() => {
    return {
      uid,
      claim,
      claim_id,
      user,
    }
  })
}

module.exports = {
  handleCreateStellarAccount,
  handleClaimSix
}
