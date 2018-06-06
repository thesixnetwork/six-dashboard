const admin = require('firebase-admin')
const uuid = require('uuid/v5')
const fs = require('fs')
const configPath = __dirname + '/config/config.json'
const privateUserPath = __dirname + '/output/private_sale.json'
const privateUsers = require(privateUserPath)
const serviceAccount = require(configPath)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sixdashboard.firebaseio.com'
})
const db = admin.firestore()
Promise.all(privateUsers.map(generateUser))
  .then(val => {
    console.log(JSON.stringify(val, null, 2))
    fs.writeFileSync(privateUserPath, JSON.stringify(privateUsers, null, 2))
    console.log('done')
    process.exit(0)
  })

async function generateUser (user) {
  const uid = await getUIDByEmail(user.email)
  if (uid) {
    user.uid = uid
    const message = `email ${user.email} already exists.`
    return db.collection('users').doc(uid)
      .set({private_user: true}, { merge: true })
      .then(() => {
        return message
      })
  }
  let newUid = `pri-${uuid(user.email, uuid.URL)}`
  let newUser = {
    uid: newUid,
    email: user.email.trim(),
    emailVerified: true,
    password: Math.random().toString(36).slice(-8),
    displayName: `${user.firstname} ${user.lastname}`,
    disabled: false
  }
//  if (user.phone_number !== undefined && user.phone_number !== '' && user.phone_number !== null) {
//    newUser.phoneNumber = user.phone_number
//  }
  return admin.auth().createUser(newUser)
  .then(function (userRecord) {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log('Successfully created new user:', userRecord.uid, user.email)
    user.uid = userRecord.uid
    return userRecord
  })
  .then(userRecord => {
    let setData = {
      uid: newUid,
      email: user.email,
      registration_time: (new Date()).getTime(),
      private_user: true,
      first_name: user.firstname,
      last_name: user.lastname,
      is_redeem_account: false,
      redeem_code: Math.random().toString(36).replace(/[^a-z0-9]+/g, "").toUpperCase()
    }
    if (user.phone_number !== undefined && user.phone_number !== '' && user.phone_number !== null) {
      setData.phone_number = user.phone_number
      //setData.phone_verified = true
    }
    return admin.firestore().collection('users').doc(newUid).set(setData, { merge: true }).then(() => {
      return userRecord
    }).catch(() => {
      return userREcord
    })
  })
  .catch(function (error) {
    console.log('Error creating new user:', error)
    return error.message
  })
}

async function getUIDByEmail (email) {
  return admin.auth().getUserByEmail(email).then((userRecord) => userRecord.uid).catch(() => false)
}
