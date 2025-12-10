const express = require('express')
const {
addOrderToMongo,
index,
addOrderAmazeMongo
  
} = require('../controller/orderController')

const router = express.Router()

router.get('/', index)
router.post('/addOrderToMongo', addOrderToMongo)
router.post('/addOrderAmazeMongo', addOrderAmazeMongo)
module.exports = router
