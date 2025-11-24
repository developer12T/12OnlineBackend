const express = require('express');
const ProductManage = express.Router();

const getProduct = require('../controller/getProduct')
const addProduct = require('../controller/addProduct')
const updateStock = require('../controller/updateStock')
const updateStock12T = require('../controller/updateStock12T')


ProductManage.use('/ProductManage',getProduct);
ProductManage.use('/ProductManage',addProduct);

ProductManage.use('/ProductManage',updateStock12T);
ProductManage.use('/ProductManage',updateStock);




module.exports = ProductManage;