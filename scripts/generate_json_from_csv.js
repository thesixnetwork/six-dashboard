const papa = require('papaparse')
const _ = require('underscore')
const fs = require('fs')
const path = __dirname + '/token_distribution.csv'
const file = fs.readFileSync(path).toString()
const outputPath = __dirname + '/output'
const shift = d => d.shift()

const times = (x) => f => {
  if (x > 0) {
    f()
    times(x - 1)(f)
  }
}
const model = {
  'firstname': 2,
  'lastname': 2,
  'email': 3,
  'phone_number': 4,
  'total_six': 5,
  'type': 5,
  'd+0': 6,
  'd+30': 7,
  'd+60': 8,
  'd+90': 9,
  'd+365': 10,
  'tx_ids': 11
}

const conditions = {
  'first_day_trade': 1529020800000
}

const addClaimPeriod = (claimPeroids, days, amount, type) => {
  const dayInMS = days * 86400000
  claimPeroids.push({
    amount,
    valid_after: conditions.first_day_trade + dayInMS,
    type
  })
}

const toJSON = (d) => {
  return d.map(roll => {
    if (roll[model.firstname] === '') return
    if (roll[model.email] === '') return
    if (roll[model.phone_number] === '') return
    if (!roll[model.type] && roll[model.type] === '') return
    const type = roll[model.type]
    const obj = {
      firstname: roll[model.firstname],
      lastname: roll[model.lastname] || '',
      email: roll[model.email],
      phone_number: roll[model.phone_number],
      claim_periods: []
    }
    if (roll[model['d+0']]) addClaimPeriod(obj.claim_periods, 0, parseFloat(roll[model['d+0']].replace(/,/g, '')), type)
    if (roll[model['d+30']]) addClaimPeriod(obj.claim_periods, 30, parseFloat(roll[model['d+30']].replace(/,/g, '')), type)
    if (roll[model['d+60']]) addClaimPeriod(obj.claim_periods, 60, parseFloat(roll[model['d+60']].replace(/,/g, '')), type)
    if (roll[model['d+90']]) addClaimPeriod(obj.claim_periods, 90, parseFloat(roll[model['d+90']].replace(/,/g, '')), type)
    if (roll[model['d+365']]) addClaimPeriod(obj.claim_periods, 365, parseFloat(roll[model['d+365']].replace(/,/g, '')), type)
    if (roll[model['tx_ids']]) { obj.tx_ids = roll[model['tx_ids']].split(',') } else obj.tx_ids = []
    if (obj.claim_periods.length > 0) return obj
  })
}

papa.parse(file, {
  complete: function (results) {
    times(3)(() => shift(results.data))
    const r = _.compact(toJSON(results.data))
    const json = JSON.stringify(r, null, 2)
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)
    fs.writeFile(outputPath + '/private_sale.json', json, (err) => {
      if (err) throw err
      console.log('The file has been saved!')
    })
  }
})
