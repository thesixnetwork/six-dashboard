const path = '/purchase_txs/{txId}'

module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [{
    'name': 'incrementTotalAsset',
    'module': events.onCreate(event => incrementTotalAsset(event, functions, fireStore))
  }]
}

function incrementTotalAsset (event, functions, fireStore) {
  const data = event.data.data()
  console.log('Create Transaction:', event.params.txId, data.type, data.native_amount)
  const assetCol = fireStore.collection('total_asset')
  return fireStore.runTransaction(tx => Promise.all([
    {type: data.type, key: 'native_amount'},
    {type: 'usd', key: 'total_usd_price'},
    {type: 'six', key: 'six_amount'}
  ].map(asset => {
    const ref = assetCol.doc(asset.type)
    return tx.get(ref).then(assetDoc => tx.update(ref, {total: assetDoc.data().total + data[asset.key]}))
  })
  )
  )
}
