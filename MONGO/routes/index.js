const express = require('express')
const orderRoute = require('./orderRoutes')
const customerRoute = require('./customerRoutes')
const productRoute = require('./productRoutes')
const router = express.Router()

router.use('/orderMongo', orderRoute)
router.use('/customerMongo', customerRoute)
router.use('/productMongo', productRoute)


module.exports = router