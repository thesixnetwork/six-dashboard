const path = '/purchase_txs/{txId}'

module.exports = function (functions, fireStore) {
  const events = functions.firestore.document(path)
  return [
    {
      'name': 'incrementTotalAsset',
      'module': events.onCreate(event => incrementTotalAsset(event, fireStore))
    }, {
      'name': 'presaleBonus',
      'module': events.onCreate(event => presaleBonus(event, fireStore))
    }
  ]
}

function incrementTotalAsset (event, fireStore) {
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

function presaleBonus (event, fireStore) {
  const purchaseTxData = event.data.data()
  const txId = event.params.txId
  const presaleCol = fireStore.collection('presale')
  return fireStore.runTransaction(tx => {
    const presaleRef = presaleCol.doc('supply')
    const purchasedPresaleRef = presaleRef.collection('purchased_presale_tx')
    return tx.get(presaleRef).then(presaleDoc => {
      const supplyInfo = presaleDoc.data()
      if (supplyInfo.total_received_xlm >= supplyInfo.limit_presale_xlm) {
        return Promise.resolve('Presale is soldout!')
      }
      const latestReceivedXLM = supplyInfo.total_received_xlm + purchaseTxData.six_amount
      const userPurchasedPresaleRef = purchasedPresaleRef.doc(purchaseTxData.user_id)
      const bonus = purchaseTxData.six_amount * (supplyInfo.bonus_times || 0.06)
      return Promise.all([
        tx.update(presaleRef, {total_received_xlm: latestReceivedXLM}),
        tx.set(userPurchasedPresaleRef,
          {[txId]: { tx_id: txId,
            user_id: purchaseTxData.user_id,
            original_six: purchaseTxData.six_amount,
            bonus,
            total: bonus + purchaseTxData.six_amount }
          }, {merge: true})
      ])
    })
  })
}
