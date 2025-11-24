const express = require('express');
const OrderManage = express.Router();
const router = express.Router();

const getOrder = require('../controller/getOrder')
const addOrder = require('../controller/addOrder')
const addOrderby = require('../controller/addOrderByDate')
const addOrderMakro = require('../controller/addOrderMakro')
const addOrderAmaze = require('../controller/addOrderAmaze')
// const { addOrderErpRepair } = require('../controller/addOrderErp')

const addDeatail = require('../controller/subAddOrder/addDeatail')
const addOrderNew = require('../controller/subAddOrder/addOrder')
const addCustomer = require('../controller/subAddOrder/addCustomer')
const cusStock = require('../controller/subAddOrder/cutStock')
const updateStatusOrder = require('../controller/subAddOrder/updateStatus')
const updateOrderErp = require('../controller/updateErpVoided')

const getDataPrintReceipt = require('../controller/getDataPrintReceipt')
const getOrder12TIntoM3 = require('../controller/getOrder12TIntoM3')

OrderManage.use('/OrderManage', getOrder);
OrderManage.use('/OrderManage', addOrder);

OrderManage.use('/OrderManage', addOrderby);
OrderManage.use('/OrderManage', addOrderMakro);
OrderManage.use('/OrderManage', addOrderAmaze);
OrderManage.use('/OrderManage', addDeatail);
OrderManage.use('/OrderManage', addOrderNew);
OrderManage.use('/OrderManage', addCustomer);
OrderManage.use('/OrderManage', cusStock);
OrderManage.use('/OrderManage', updateStatusOrder);
OrderManage.use('/OrderManage', updateOrderErp);


OrderManage.use('/OrderManage', getDataPrintReceipt);
OrderManage.use('/OrderManage', getOrder12TIntoM3);

module.exports = OrderManage;