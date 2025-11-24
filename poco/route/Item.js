const express = require('express');
const ItemManage = express.Router();

const addItemMaster = require('../controller/addItemMaster')
const getPreItem = require('../controller/getPreItem')
const getDashboard = require('../controller/getDashBoard')
const getDateLast = require('../controller/getDateLast')
const deletePreItem = require('../controller/deletePreItem')
const getItem = require('../controller/getItem')

ItemManage.use('/ItemManage',addItemMaster);
ItemManage.use('/ItemManage',getPreItem);
ItemManage.use('/ItemManage',getDashboard);
ItemManage.use('/ItemManage',getDateLast);
ItemManage.use('/ItemManage',deletePreItem);
ItemManage.use('/ItemManage',getItem);

module.exports = ItemManage;