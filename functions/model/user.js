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
    // let promise = new Promise(function (resolve, reject) {
    let isXss = false
    for (var key in data) {
      if (/script.*src/.test(data[key]) || /img.*src/.test(data[key])) {
        isXss = true
      }
    }
    if (isXss === false) {
      return User.collection.doc(context.auth.uid).set(Object.assign(data, {kyc_status: 'not_complete'}), {merge: true})
        .then((data) => { return data })
    } else {
      Error('Script detected')
    }
    // })
    // return promise
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
        let isXss = false
        for (var key in data) {
          if (/script.*src/.test(data[key]) || /img.*src/.test(data[key])) {
            isXss = true
          }
        }
        if ((isXss === false) && (data.kyc_status === 'pending' ||
          (data.kyc_status === null && currentUser.kyc_status === 'rejected') ||
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
             'phone_number',
             'first_transaction',
             'alloc_transaction',
             'alloc_transaction_type',
             'alloc_transaction_amount',
             'alloc_transaction_six_amount',
             'alloc_time',
             'submit_wallet',
             'seen_congrat'
           ], Object.keys(data)) ||
           (data.all_done && currentUser.kyc_status === 'approved')
        )) {
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
