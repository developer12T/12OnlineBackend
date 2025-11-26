const mongoose = require('mongoose')
require('dotenv').config()

const dbCA_UAT = mongoose.createConnection(process.env.CA_DB_URI_UAT)


dbCA_UAT.on('connected', () => console.log('Connected to Cash DB UAT'))
dbCA_UAT.on('error', err => console.error('Cash DB UAT Error:', err))

module.exports = {

  dbCA_UAT
}
