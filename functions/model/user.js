const admin = require('firebase-admin')
const ArtemisAPI = require('./artemisAPI')
const FormData = require('form-data')

module.exports = function (functions, fireStore) {
  return [{
    'name': 'signUp',
    'module': functions.https.onCall((data, context) => User.signUp(data, context))
  }, {
    'name': 'updateUser',
    'module': functions.https.onCall((data, context) => User.updateUser(functions, data, context))
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

  static updateUser (functions, data, context) {
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
            if (data.kyc_status === 'pending') {
              console.log('PENDING CASE')
              return User.kycArtemis(functions, data, context)
            } else {
              return {
                success: true, code: 500
              }
            }
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

  static kycArtemis (functions, data, context) {
    let artemis = new ArtemisAPI(functions.config().astemis.host, functions.config().astemis.app, functions.config().astemis.token)
    return User.collection.doc(context.auth.uid).get().then(doc => {
      let userData = doc.data()
      if (typeof (userData.kyc_error_count) === 'undefined') {
        userData.kyc_error_count = 0
      }
      if (data.kyc_status === 'pending' && userData.kyc_error_count < 3) {
        console.log('Case 1 Condition')
        return admin.database().ref('/country/' + userData.country + '/').once('value').then(function (snapshot) {
          console.log('In Realtime')
          let artemisData = {
            domain_name: functions.config().astemis.domain_name,
            rfrID: userData.uid,
            first_name: userData.first_name,
            last_name: userData.last_name,
            nationality: snapshot.val().nationality,
            country_of_residence: snapshot.val().country,
            ssic_code: 'UNKNOWN',
            ssoc_code: 'UNKNOWN',
            onboarding_mode: 'NON FACE-TO-FACE',
            payment_mode: 'VIRTUAL CURRENCY',
            product_service_complexity: 'COMPLEX',
            addresses: userData.address,
            identification_number: userData.citizen_id,
            telephone_numbers: [
              userData.phone_number
            ],
            emails: [
              userData.email
            ]
          }
          return artemis.getIndividualCustomer({cust_rfr_id: userData.uid}).then(data => {
            console.log('Update Profile')
            artemisData.cust_rfr_id = userData.uid
            delete artemisData['rfrID']
            return artemis.updateIndividualCustomer(artemisData)
          }).catch(err => {
            console.log(err.response.data.errors)
            console.log('Create Profile')
            return artemis.createIndividualCustomer(artemisData)
          }).then(astermisUser => {
            console.log('Upload Doc')
            let photoId = new FormData()
            photoId.append('document_type', 'PASSPORT')
            photoId.append('authenticity', 'SIGHTED ORIGINAL')
            photoId.append('cust_rfr_id', userData.uid)
            let astemisPhoto = artemis.createIndividualCustomerDoc(userData.pic4, photoId)
            let selfie = new FormData()
            selfie.append('document_type', 'SELFIE')
            selfie.append('authenticity', 'SIGHTED ORIGINAL')
            selfie.append('cust_rfr_id', userData.uid)
            let astemisSelfie = artemis.createIndividualCustomerDoc(userData.pic2, selfie)
            return Promise.all([astemisPhoto, astemisSelfie])
          }).then(values => {
            console.log('Check Face')
            let [astemisPhoto, astemisSelfie] = values
            console.log(astemisPhoto.data.id)
            console.log(astemisSelfie.data.id)
            let faceId = {
              cust_rfr_id: userData.uid,
              source_doc_id: astemisPhoto.data.id,
              target_doc_id: astemisSelfie.data.id
            }
            return artemis.checkIndividualFaceCustomer(faceId)
          }).then(face => {
            console.log('Create Invidividual Report')
            if (typeof (userData.kyc_error_count) === 'undefined') {
              userData.kyc_error_count = 0
            }
            let updateData = {
              kyc_status: null,
              reject_type: null,
              updater: 'auto',
              update_time: Date.now(),
              kyc_error_count: userData.kyc_error_count + 1
            }
            console.log(face.data.compare_result)
            switch (face.data.compare_result) {
              case 'MATCH':
                return artemis.createIndividualCustomerReport({cust_rfr_id: userData.uid}).then(report => {
                  if (report.data.approval_status === 'CLEARED') {
                    updateData = {
                      kyc_status: 'approved',
                      updater: 'auto',
                      update_time: Date.now(),
                      all_done: true
                    }
                    return admin.firestore().collection('users').doc(userData.uid).update(updateData).then(data => {
                      return {success: true}
                    })
                  }
                })
              case 'NO MATCH':
                return admin.firestore().collection('users').doc(userData.uid).update(updateData).then(data => {
                  return {success: false, error: 'NO MATCH'}
                })
              case 'UNCERTAIN':
                return admin.firestore().collection('users').doc(userData.uid).update(updateData).then(data => {
                  return {success: false, error: 'UNCERTAIN'}
                })
            }
          }).catch(err => {
            if (typeof (userData.kyc_error_count) === 'undefined') {
              userData.kyc_error_count = 0
            }
            let updateData = {
              kyc_status: null,
              reject_type: null,
              updater: 'auto',
              update_time: Date.now(),
              kyc_error_count: userData.kyc_error_count + 1
            }
            switch (err.response.data.compare_result) {
              case 'UNCERTAIN':
                return admin.firestore().collection('users').doc(userData.uid).update(updateData).then(data => {
                  return {success: false, error: 'UNCERTAIN'}
                })
            }
          })
        })
      } else {
        return {success: true, code: 205}
      }
    })
  }
}
