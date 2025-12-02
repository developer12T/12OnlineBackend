const express = require('express')
const orderRoute = require('./orderRoutes')
const customerRoute = require('./customerRoutes')
const productRoute = require('./productRoutes')
const shippingRoute = require('./shippingRoutes')
const router = express.Router()

router.use('/orderMongo', orderRoute)
router.use('/customerMongo', customerRoute)
router.use('/productMongo', productRoute)
router.use('/shippingMongo', shippingRoute)


module.exports = router