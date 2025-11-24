const express = require('express')


const { addProduct } = require('../controller/mongoController/productController')

const router = express.Router()

router.post('/addProduct', addProduct)



module.exports = router