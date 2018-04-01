const auditlogFunctions = [
  {'name': 'auditlogUser', 'path': '/users/{uid}', 'collection': 'users'},
  {'name': 'auditlogTest', 'path': '/tests/{id}', 'collection': 'tests'}
]

module.exports = function (functions, fireStore) {
  const auditlogs = []
  for (let functionName of auditlogFunctions) {
    let events = functions.firestore.document(functionName.path)
    auditlogs.push({
      'name': `${functionName.name}`,
      'module': events.onWrite(event => new Auditlog(event, functions, fireStore, functionName.collection).handler())
    }
    )
  }
  return auditlogs
}

class Auditlog {
  constructor (event, functions, fireStore, collection) {
    this.event = event
    this.functions = functions
    this.fireStore = fireStore
    this.collection = collection
  }

  handler () {
    let action
    const newValue = this.event.data.data()
    const previousValue = this.event.data.previous.data()
    let data
    if (this.event.data.exists) {
      data = {id: this.event.data.id, created_at: new Date(Date.now())}
      let keys = Object.keys(newValue)
      for (let key of keys) {
        if (typeof (previousValue) === 'undefined') {
          data[key] = [null, newValue[key]]
          action = 'create'
        } else {
          if (previousValue[key] !== newValue[key]) {
            if (typeof (previousValue[key]) === 'undefined') {
              previousValue[key] = null
            }
            data[key] = [previousValue[key], newValue[key]]
            action = 'update'
          }
        }
      }
    } else {
      action = 'delete'
      data = {id: this.event.data.previous.id, created_at: new Date(Date.now())}
      let keys = Object.keys(previousValue)
      for (let key of keys) {
        data[key] = [previousValue[key], null]
      }
    }
    data['action'] = action
    console.log(data)
    return this.fireStore.collection('auditlogs').doc(this.collection).collection('audited_changes').add(data)
  }
}
