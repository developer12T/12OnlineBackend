const express = require('express')
const route = require('./platform/index')
const bentoRoute = require('./bento/index')

const router = express.Router()

router.use('/api', route)
router.use('/bento/api', bentoRoute)

module.exports = router