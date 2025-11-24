const express = require('express');
const ZortRestApi = express.Router();

const getCustomer = require('../controller/getCustomer')
const getOrder12T = require('../controller/getOrder12T')

ZortRestApi.use('/12Trading',getCustomer);
ZortRestApi.use('/12Trading',getOrder12T);


module.exports = ZortRestApi;