const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')
module.exports = {
  'approved': handlebars.compile(fs.readFileSync(path.join(__dirname, 'approve_email_template.html'), {encoding: 'utf-8'})),
  'rejected_need_more': handlebars.compile(fs.readFileSync(path.join(__dirname, 'reject_need_more_email_template.html'), {encoding: 'utf-8'})),
  'rejected_restricted': handlebars.compile(fs.readFileSync(path.join(__dirname, 'reject_restricted_email_template.html'), {encoding: 'utf-8'})),
  'rejected_photo_corrupted': handlebars.compile(fs.readFileSync(path.join(__dirname, 'reject_photo_corrupted_email_template.html'), {encoding: 'utf-8'})),
  'rejected_other': handlebars.compile(fs.readFileSync(path.join(__dirname, 'reject_other_email_template.html'), {encoding: 'utf-8'})),
  'pending': handlebars.compile(fs.readFileSync(path.join(__dirname, 'received_email_template.html'), {encoding: 'utf-8'})),
  'received_deposit': handlebars.compile(fs.readFileSync(path.join(__dirname, 'received_deposit.html'), {encoding: 'utf-8'}))
}
