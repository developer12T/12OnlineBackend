const express = require('express');
const ItemManage = express.Router();

const Item = require('../controller/getItem')

ItemManage.use('/Item',Item);

module.exports = ItemManage;