const express = require('express')
const orderRoute = require('./orderRoutes')

const router = express.Router()

router.use('/orderMongo', orderRoute)




module.exports = router