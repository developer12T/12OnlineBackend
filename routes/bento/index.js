const express = require('express')
const orderRoute = require('./order.routes')
const productRoute = require('./product.routes')
const webhookRoute = require('./webhook.routes')
const tiggerRoute = require('./tigger.routes')



const router = express.Router()

router.use('/order', orderRoute)
router.use('/webhook', webhookRoute)
router.use('/tigger', tiggerRoute)
router.use('/product', productRoute)

module.exports = router