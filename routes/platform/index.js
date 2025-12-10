const express = require('express')
const orderRoute = require('./order')


const router = express.Router()

router.use('/order', orderRoute)

module.exports = router