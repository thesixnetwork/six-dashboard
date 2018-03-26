const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')
module.exports = {
  'approved': handlebars.compile(fs.readFileSync(path.join(__dirname, 'approve_email_template.html'), {encoding: 'utf-8'})),
  'rejected': handlebars.compile(fs.readFileSync(path.join(__dirname, 'reject_email_template.html'), {encoding: 'utf-8'})),
  'pending': handlebars.compile(fs.readFileSync(path.join(__dirname, 'received_email_template.html'), {encoding: 'utf-8'}))
}
