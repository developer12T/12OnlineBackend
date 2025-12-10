const express = require('express')
const {
 getOrderBento
} = require('../../controllers/oder.controller')

const router = express.Router()

router.get('/getOrder', getOrderBento);

// router.post('/insert', getOrder)
module.exports = router
