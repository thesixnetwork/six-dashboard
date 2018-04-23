const functions = require('firebase-functions')
const StellarSdk = require('stellar-sdk')
const admin = require('firebase-admin')
const db = admin.firestore()

let stellarUrl
if (functions.config().campaign.is_production === "true") {
    stellarUrl =  'https://horizon.stellar.org'
    StellarSdk.Network.usePublicNetwork()
} else {
    stellarUrl = 'https://horizon-testnet.stellar.org'
    StellarSdk.Network.useTestNetwork()
}

const server = new StellarSdk.Server(stellarUrl)


const issuerKey = StellarSdk.Keypair.fromSecret(functions.config().xlm.issuer_low_secret)
const distKey = StellarSdk.Keypair.fromSecret(functions.config().xlm.ico_distributor_secret)

const startingBalance = '2.5'

const handleCreateStellarAccount = (req, res) => {
  if (!issuerKey || !distKey) {
    return res.status(503).json({
      error: 'not yet config stellar params'
    })
  }

  const uid = req.body.uid
  const publicKey = req.body.public_key
  console.log(req.body)

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
  console.log("publicKey = ", JSON.stringify(publicKey, null, 4));
  console.log("distKey.publicKey() = ", JSON.stringify(distKey.publicKey(), null, 4));

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

  function submitTransaction ({uid, public_key: publicKey, transaction}) {
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

module.exports = {
  handleCreateStellarAccount
}
