const admin = require('firebase-admin')
const uuid = require('uuid/v5')
const configPath = __dirname + '/config/config.json'
const privateUserPath = __dirname + '/output/private_sale.json'
const privateUsers = require(privateUserPath)
const serviceAccount = require(configPath)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://six-dashboard.firebaseio.com'
})
const db = admin.firestore()
Promise.all(privateUsers.map(generateUser))
  .then(val => {
    console.log(JSON.stringify(val, null, 2))
    console.log('done')
    process.exit(0)
  })

async function generateUser (user) {
  const uid = await getUIDByEmail(user.email)
  if (uid) {
    const message = `email ${user.email} already exists.`
    return db.collection('users').doc(uid)
      .update({private_user: true})
      .then(() => {
        return message
      })
  }
  const newUser = {
    uid: `pri-${uuid(user.email, uuid.URL)}`,
    email: user.email,
    emailVerified: false,
    phoneNumber: user.phone_number,
    password: Math.random().toString(36).slice(-8),
    displayName: `${user.firstname} ${user.lastname}`,
    disabled: false
  }
  return admin.auth().createUser(newUser)
  .then(function (userRecord) {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log('Successfully created new user:', userRecord.uid, user.email)
    return userRecord
  })
  .catch(function (error) {
    console.log('Error creating new user:', error)
    return error.message
  })
}

async function getUIDByEmail (email) {
  return admin.auth().getUserByEmail(email).then((userRecord) => userRecord.uid).catch(() => false)
}
