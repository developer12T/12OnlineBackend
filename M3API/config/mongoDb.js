const mongoose = require('mongoose')
require('dotenv').config()

const CA_DB_URI_UAT = mongoose.createConnection(process.env.CA_DB_URI_UAT)

CA_DB_URI_UAT.on('connected', () => console.log('Connected to Cash DB UAT'))
CA_DB_URI_UAT.on('error', err => console.error('Cash DB UAT Error:', err))

module.exports = {
  CA_DB_URI_UAT
}
