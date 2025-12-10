const express = require('express')
const {
 getOrderBento
} = require('../../controllers/oderController')

const router = express.Router()

router.get('/getorder', getOrderBento)

// router.post('/insert', getOrder)
module.exports = router
