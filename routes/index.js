const express = require('express')
const route = require('./platform/index')
const bentoRoute = require('./bento/index')
const printRoute = require('./print.route')

const router = express.Router()

router.use('/api', route)
router.use('/bento', bentoRoute)
router.use('/print', printRoute)

module.exports = router