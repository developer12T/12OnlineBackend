const express = require('express');
const OrderManage = express.Router();

const Order = require('../controller/getOrder')
const updateNumberRunning = require('../controller/updateNumberRunning')
const { addOrderErp, addOrderErpRepair } = require('../controller/addOrderErp')
// const addOrderErp = require('../controller/addOrderErp')
const addOrderM3 = require('../controller/addOrderM3')
const getOrderErp = require('../controller/getOrderErp')
const addCustomerInv = require('../controller/addCustomerInv')
const addOnlineCustomerM3 = require('../controller/addOnlineCustomerM3')

OrderManage.use('/order', Order);
OrderManage.use('/order', updateNumberRunning);
OrderManage.use('/order', addOrderErp);
OrderManage.use('/order', addOrderErpRepair);
OrderManage.use('/order', addOrderM3);
OrderManage.use('/order', getOrderErp);
OrderManage.use('/order', addCustomerInv);
OrderManage.use('/order', addOnlineCustomerM3);

module.exports = OrderManage;