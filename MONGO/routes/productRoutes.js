const express = require('express')
const {
addProductToMongo,

  
} = require('../controller/productController')

const router = express.Router()

router.post('/addProductToMongo', addProductToMongo)

module.exports = router
