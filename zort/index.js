const express = require('express');
const router = express.Router();

const OrderManage = require('./route/order');
const ProductManage = require('./route/product');
const ZortRestApi = require('./route/zortRestApi');
const customer = require('./route/customer');
const syncdatabase = require('./controller/syncdatabase');
const DasboardView = require('./controller/dashboard');


router.use('/order', OrderManage);
router.use('/customer', customer);
router.use('/product', ProductManage);
router.use('/rest12Tzort',ZortRestApi);
router.use('/infor',DasboardView);
router.use('/syncdatabase',syncdatabase);

module.exports = router