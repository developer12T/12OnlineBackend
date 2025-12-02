const express = require('express')
const {
addshippingTableToMongo
  
} = require('../controller/shippingController')

const router = express.Router()

router.post('/addshippingTableToMongo', addshippingTableToMongo)

module.exports = router
