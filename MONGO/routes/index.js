const express = require('express')
const orderRoute = require('./orderRoutes')
const customerRoute = require('./customerRoutes')
const router = express.Router()

router.use('/orderMongo', orderRoute)
router.use('/customerMongo', customerRoute)



module.exports = router