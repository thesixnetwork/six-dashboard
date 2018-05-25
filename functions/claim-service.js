const functions = require('firebase-functions')
const StellarSdk = require('stellar-sdk')
const admin = require('firebase-admin')
const db = admin.firestore()
const claimRef = db.collection('users_claim')
const userRef = db.collection('users')

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

const handleCreateStellarAccount = (data, context) => {
  if (!distKey) {
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
    .then(createStellarAccount)
    .then(updateUserWalletAccount)    
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
  return server.loadAccount(publicKey).then(an_account => {
    if(!checkBalanceForTrust(an_account)) {
      return server
        .loadAccount(distKey.publicKey())
        .then(createTransaction)
        .then(submitTransaction)
        .then(updateUserCreatedAccount)
    }else {
      return { uid, public_key: publicKey }
    }
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
    .update({
      'sent_xlm': true
    })
}

const handleClaimSix = (data, context) => {
  if (!distKey) {
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

function findUser ({ uid, claim_id: claimId }) {
  console.log("find user")
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
  console.log("sendSix")
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
  console.log("updateClaim")
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
        user
      }
    })
}

module.exports = {
  handleCreateStellarAccount,
  handleClaimSix,
  findUser,
  findClaim,
  sendSix,
  updateClaim,
}

const checkBalanceForTrust = (distributorAccount){
  let balancesCount = (distributorAccount.balances.length - 1)
  let leastXLM = (balances_count * 0.5) + 2
  let xlmBlance = distributorAccount.balances.filter(balance => {if(balance.asset_type === 'native'){return true} } )[0].balance
  if(parseFloat(xlmBlance) > leastXLM) {
    return true
  } else {
    return false
  }
}
