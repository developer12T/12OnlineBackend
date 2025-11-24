const express = require('express');
const StockManage = express.Router();

const Stock = require('../controller/getStock')

StockManage.use('/stock',Stock);

module.exports = StockManage;