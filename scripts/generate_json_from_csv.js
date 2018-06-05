const papa = require('papaparse')
const _ = require('underscore')
const fs = require('fs')
const path = __dirname + '/token_distribution.csv'
const file = fs.readFileSync(path).toString()
const outputPath = __dirname + '/output'
const shift = d => d.shift()
const privateSaleTxIds = []

const times = (x) => f => {
  if (x > 0) {
    f()
    times(x - 1)(f)
  }
}
const model = {
  'firstname': 1,
  'email': 3,
  'phone_number': 4,
  'total_six': 8,
  'normal_six': 9,
  'bonus_six': 10,
  'type': 6,
  'd+0': 12,
  'd+30': 13,
  'd+60': 14,
  'd+90': 15,
  'd+180': 16,
  'd+365': 17,
  'd+730': 18,
  'd+1095': 19,
  'd+630': 20,
  'tx_ids': 2
}

const conditions = {
  'first_day_trade': 1528275600000
}

const addClaimPeriod = (claimPeroids, days, amount, type, normalSix, bonusSix) => {
  const dayInMS = days * 86400000
  let bonus = 0
  if (normalSix !== undefined && normalSix !== '') {
    bonus = bonusSix/(normalSix/100)
  }
  claimPeroids.push({
    amount,
    valid_after: conditions.first_day_trade + dayInMS,
    type,
    bonus,
    normal_six: normalSix,
    bonus_six: bonusSix
  })
}

let allUsers = {}

const toJSON = (d) => {
  return d.map(roll => {
    if (roll[model.firstname] === '') return
    if (roll[model.email] === '') return
    if (!roll[model.type] && roll[model.type] === '') return
    const type = roll[model.type]
    let obj
    if (allUsers[roll[model.email]] === undefined) {
      obj = {
        firstname: roll[model.firstname],
        lastname: '',
        email: roll[model.email],
        claim_periods: []
      }
      if (roll[model.phone_number] !== undefined && roll[model.phone_number] !== '') {
        obj.phone_number = '+'+roll[model.phone_number].replace(/ /g, '').replace(/-/g, '')
      }
    } else {
      obj = allUsers[roll[model.email]]
    }
    if (roll[model['d+0']]) addClaimPeriod(obj.claim_periods, 0, parseFloat(roll[model['d+0']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+30']]) addClaimPeriod(obj.claim_periods, 30, parseFloat(roll[model['d+30']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+60']]) addClaimPeriod(obj.claim_periods, 60, parseFloat(roll[model['d+60']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+90']]) addClaimPeriod(obj.claim_periods, 90, parseFloat(roll[model['d+90']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+180']]) addClaimPeriod(obj.claim_periods, 180, parseFloat(roll[model['d+180']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+365']]) addClaimPeriod(obj.claim_periods, 365, parseFloat(roll[model['d+365']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+730']]) addClaimPeriod(obj.claim_periods, 730, parseFloat(roll[model['d+760']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+1095']]) addClaimPeriod(obj.claim_periods, 1095, parseFloat(roll[model['d+1095']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['d+630']]) addClaimPeriod(obj.claim_periods, 630, parseFloat(roll[model['d+630']].replace(/,/g, '')), type, parseFloat(roll[model.normal_six].replace(/,/g, '')), parseFloat(roll[model.bonus_six].replace(/,/g, '')))
    if (roll[model['tx_ids']]) {
      const txs = roll[model['tx_ids']].replace(/ /g, '').split(',')
      obj.tx_ids = roll[model['tx_ids']].replace(/ /g, '').split(',')
      privateSaleTxIds.push(...txs)
    } else obj.tx_ids = []
    if (obj.claim_periods.length > 0) {
      if (allUsers[obj.email] === undefined) {
        allUsers[obj.email] = obj
      }
      return obj
    }
  })
}

papa.parse(file, {
  complete: function (results) {
    times(3)(() => shift(results.data))
    const r = _.compact(toJSON(results.data))
    let arrayOfData = []
    for(email in allUsers) {
      arrayOfData.push(allUsers[email])
    }
    const json = JSON.stringify(arrayOfData, null, 2)
    const txsJson = JSON.stringify(privateSaleTxIds, null, 2)
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)
    fs.writeFile(outputPath + '/private_sale.json', json, (err) => {
      if (err) throw err
      console.log('The file private_sale.json has been saved!')
    })
    fs.writeFile(outputPath + '/private_sale_txs.json', txsJson, (err) => {
      if (err) throw err
      console.log('The file private_sale_txs.json has been saved!')
    })
  }
})
