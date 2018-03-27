const collections = require('./fireStoreCollection.json')

module.exports = initFireStoreData

function initFireStoreData (fireStore) {
  collections.map(col => {
    return col
      .docs.map(doc => ({ ref: fireStore.collection(col.name).doc(doc.name), doc: doc.fields }))
      .map(docRef => {
        docRef.ref.get().then(d => {
          if (d.exists) return
          docRef.ref.set(docRef.doc)
        })
      })
  })
}
