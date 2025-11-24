const express = require('express');
const itemFplusManage = express.Router();

const getItemFplus = require('../controller/getItemFplus')

itemFplusManage.use('/Item',getItemFplus);

module.exports = itemFplusManage;