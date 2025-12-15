const express = require('express')
const { getOrder } = require('../../controllers/webhook.controller')

const router = express.Router()

router.post('/:action', getOrder)

// router.post('/insert', getOrder)
module.exports = router
