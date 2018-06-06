module.exports = function (admin, functions, fireStore) {
  return [
    ...require('./purchaseTransaction')(functions, fireStore),
    ...require('./user')(admin, functions, fireStore),
    ...require('./auditlog')(functions, fireStore),
    ...require('./claimProcess')(functions, fireStore)
  ]
}
