const express = require('express')
const {
 sysnceProductBento
} = require('../../controllers/product.controller')

const router = express.Router()

router.get('/sysnceProductBento', sysnceProductBento);

// router.post('/insert', getOrder)
module.exports = router
