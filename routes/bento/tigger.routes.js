const express = require('express')
const { tigger } = require('../../controllers/webhook.controller')

const router = express.Router()

router.post('/:action', tigger)

// router.post('/insert', getOrder)
module.exports = router
