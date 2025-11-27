const express = require('express')
const {
addCustomerTableToMongo
  
} = require('../controller/customerController')

const router = express.Router()

router.post('/addCustomerTableToMongo', addCustomerTableToMongo)

module.exports = router
