const admin = require('firebase-admin')
const fs = require('fs')
const _ = require('underscore')
const configPath = __dirname + '/config/config.json'
const airdropUserPath = __dirname + '/output/airdrop_sale.json'
const serviceAccount = require(configPath)

const airdropUsers = []

const conditions = {
  'first_day_trade': 1528275600000
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://six-dashboard.firebaseio.com'
})
const db = admin.firestore()

async function listAllUsers (nextPageToken) {
  // List batch of users, 1000 at a time.
  admin
    .auth()
    .listUsers(10, nextPageToken)
    .then(listUsersResult => {
      const promiseMap = listUsersResult.users.map(userRecord => {
        console.log('user', userRecord.uid)
        return db.collection('users').doc(userRecord.uid).get().then(doc => {
          const userInfo = doc.data()
          const airdropClaim = []
          if (doc.exists && (userInfo.kyc_status === 'approved' || userInfo.private_user === true) && (userInfo.update_time === undefined || userInfo.update_time <= 1527692400000)) {
            airdropClaim.push({
              type: 'free',
              valid_after: conditions.first_day_trade,
              amount: 20
            })
          }
          return {
            uid: userRecord.uid,
            claim_periods: airdropClaim
          }
        })
      })
      Promise.all(promiseMap)
      .then(docs => {
        const userTxs = _.filter(docs, doc => doc.claim_periods.length > 0)
        airdropUsers.push(...userTxs)
        if (listUsersResult.pageToken) {
        // List next batch of users.
          listAllUsers(listUsersResult.pageToken)
        } else {
          const jsonUser = JSON.stringify(airdropUsers, null, 2)
          fs.writeFileSync(airdropUserPath, jsonUser)
          console.log('done')
          process.exit()
        }
      })
    })
    .catch(function (error) {
      console.log('Error listing users:', error)
    })
}

// Start listing users from the beginning, 1000 at a time.
listAllUsers()
