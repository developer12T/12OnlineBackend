const express = require('express')
const orderRoute = require('./order.routes')
const productRoute = require('./product.routes')


const router = express.Router()

router.use('/order', orderRoute)
router.use('/product', productRoute)

module.exports = router