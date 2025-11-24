const express = require('express');
const CustomerManage = express.Router();
const router = express.Router();

const updateCustomerInv = require('../controller/updateCustomerInv')

CustomerManage.use('/CustomerManage',updateCustomerInv);


module.exports = CustomerManage;