module.exports = function (functions, fireStore) {
  return [
    ...require('./purchaseTransaction')(functions, fireStore),
    ...require('./user')(functions, fireStore),
    ...require('./auditlog')(functions, fireStore)
  ]
}
