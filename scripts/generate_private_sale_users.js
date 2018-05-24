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

Promise.all(privateUsers.map(generateUser))
  .then(val => console.log(val))

async function generateUser (user) {
  if (await isEmailExists(user.email)) {
    const message = `email ${user.email} already exists.`
    return Promise.resolve(message)
  }
  const newUser = {
    uid: `pri-${uuid(user.email, uuid.URL)}`,
    email: user.email,
    emailVerified: false,
    phoneNumber: user.phone_number,
    password: 'asdfasdf1234',
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

async function isEmailExists (email) {
  return admin.auth().getUserByEmail(email).then(() => true).catch(() => false)
}
