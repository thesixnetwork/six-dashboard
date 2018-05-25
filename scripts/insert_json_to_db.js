const admin = require('firebase-admin')
const uuid = require('uuid/v5')
const _ = require('lodash')
const R = require('ramda')

const configPath = __dirname + '/config/config.json'
const privateUserPath = __dirname + '/output/private_sale.json'
const publicUserPath = __dirname + '/output/public_sale.json'
const privateUsers = require(privateUserPath)
const publicUsers = require(publicUserPath)
const serviceAccount = require(configPath)
const allUsers = [...privateUsers, ...publicUsers]

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://six-dashboard.firebaseio.com'
})

const db = admin.firestore();

try {
  main()
} catch (error) {
  console.log(error)
}

/**
 * main
 */

async function main() {
    await updateUsers(allUsers)
    console.log('done')
    process.exit(0)
}

async function updateUsers(privateUsers) {
  return await Promise.all(privateUsers.map(async (privateUser) => {
      return updateUser(privateUser)
    }))
}

/**
 * update each user
 * @return Promise()
 */
async function updateUser(privateUser) {
  const email = privateUser.email
  let uid = privateUser.uid || null

  if (!uid) {
    const user = await getUserByEmail(email)
    uid = user.uid
  }

  const {user: userData, periods: userPeriods} = await getUserFromDB(uid)

  // insert if userData not exists
  const claimData = privateUser.claim_periods

  if (userData === null) {
    await insertUser(uid)
    return await Promise.all(claimData.map(async (claimDatum, i) => {
        return await insertClaimPeriods(i.toString(), uid, claimDatum)
      }))
  } else if (userData !== null
    && userPeriods.length === 0
    && claimData.length > 0
  ) {
    return await Promise.all(claimData.map(async (claimDatum, i) => {
        return await insertClaimPeriods(i.toString(), uid, claimDatum)
      }))
  } else {
    // find extra clai from userPeriods then insert
    const mapIndexed = R.addIndex(R.map);
    const filter = R.pipe(
      mapIndexed((claim, i) => {
        return {
          i,
          dup: !!_.find(userPeriods, claim),
          claim
        }
      }),
      R.filter((claim) => {
        return !claim.dup
      })
    )
    const extra = filter(claimData)
    return await Promise.all(extra.map(async ({i, claim}) => {
        return await insertClaimPeriods(i.toString(), uid, claim)
    }))
  }
}

/**
 * @return user
 */
async function getUserByEmail(email) {
  return admin
    .auth()
    .getUserByEmail(email)
}

/**
 * @return userData
 */
async function getUserFromDB(uid) {
  //db.users_claim.uid
  const docRef = db
    .collection('users_claim')
    .doc(uid)

  const [user, periods] = await docRef
    .get()
    .then(async (doc) => {
      if (!doc.exists) {
        return [null, null]
      } else {
        //db.users_claim.uid.claim_period
        const periodRef = await docRef
          .collection('claim_period')
        const periods = await periodRef
          .get()
          .then((snapshot) => {
            const docs = []
            snapshot.forEach(doc => {
              docs.push(doc.data())
            });
            return docs
          })

        return [doc.data(), periods]
      }
    }).catch((error) => {
    throw error
  })
  return {
    user,
    periods
  }
}

/**
 * insert user to uid in users_clim collection
 */
async function insertUser(uid) {
  // insert user
  const insertUserData = {
    public_key: "",
    sent_xlm: false,
    trustline: false
  }

  return db
    .collection('users_claim')
    .doc(uid)
    .set(insertUserData)
}

/**
 * insert claim period
 */
async function insertClaimPeriods(periodId, uid, claimData) {
  return db
    .collection('users_claim')
    .doc(uid)
    .collection('claim_period')
    .doc(periodId)
    .set(claimData)
}
