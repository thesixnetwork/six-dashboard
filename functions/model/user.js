const admin = require('firebase-admin')

module.exports = function (functions, fireStore) {
  return [{
    'name': 'signUp',
    'module': functions.https.onCall((data, context) => User.signUp(data, context))
  }, {
    'name': 'updateUser',
    'module': functions.https.onCall((data, context) => User.updateUser(data, context))
  }
  ]
}

class User {
  static get collection () {
    return admin.firestore().collection('users')
  }
  static get adminCollection () {
    return admin.firestore().collection('admins')
  }

  static signUp (data, context) {
    return User.collection.doc(context.auth.uid).set(data, {merge: true})
      .then((data) => { return data })
  }

  static updateUser (data, context) {
    let promise1 = new Promise(function (resolve, reject) {
      User.collection.doc(context.auth.uid).get().then((doc) => {
        if (doc.exists) {
          resolve(doc.data())
        } else {
          reject(Error('Not found'))
        }
      })
    })
    let promise2 = new Promise(function (resolve, reject) {
      User.adminCollection.doc(context.auth.uid).get().then((doc) => {
        if (doc.exists) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
    return Promise.all([promise1, promise2]).then((result) => {
      let [currentUser, isAdmin] = result
      if (isAdmin) {
        return User.collection.doc(context.auth.uid).update(data).then(function (docRef) {
          return docRef
        }).catch(function (error) {
          return error
        })
      } else {
        if (data.kyc_status === 'pending' ||
          (data.kyc_status === null && currentUser.kyc_status === 'reject') ||
           User.arrayContainsArray([
             'first_name',
             'last_name',
             'country',
             'passport_number',
             'address',
             'pic2',
             'pic3',
             'pic4',
             'estimate',
             'phone_verified',
             'phone_number'
           ], Object.keys(data)) ||
           (data.all_done && currentUser.kyc_status === 'approved')
        ) {
          return User.collection.doc(context.auth.uid).update(data).then(function (docRef) {
            return docRef
          }).catch(function (error) {
            return error
          })
        }
      }
    })
  }

  static arrayContainsArray (superset, subset) {
    return subset.every(function (value) {
      return (superset.indexOf(value) >= 0)
    })
  }
}
