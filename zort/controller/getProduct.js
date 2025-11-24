const express = require('express');
const moment = require('moment');
const { Op } = require('sequelize');
const axios = require('axios'); 
const fs = require('fs') ;

const os = require('os');

require('moment/locale/th');

const getProduct = express.Router();

const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm:ss');


// const productDataZort = require('../dataZort/allProduct');

const { Product } = require('../model/Product') ;

let createdproduct = 0;
let Updateproduct = 0;
const response = {
    status: '-- complete',
    dateTime: currentDate,
  };

  getProduct.post('/getProduct', async (req, res) => {
try {

    const data = await Product.findAll() ;
    res.json(data);
} catch (error) {
    res.status(500).json(error); 
}
});

  module.exports = getProduct;   
