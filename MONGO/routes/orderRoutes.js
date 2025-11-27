const express = require('express')
const {
addOrderToMongo,
index
  
} = require('../controller/orderController')

const router = express.Router()

router.get('/', index)
router.post('/addOrderToMongo', addOrderToMongo)

module.exports = router
