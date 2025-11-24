const express = require('express');
const moment = require('moment');
const { Op } = require('sequelize');
const axios = require('axios'); 

require('moment/locale/th');

const updateStock = express.Router();

const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm:ss');

let createdproduct = 0;
let Updateproduct = 0;

const response = {
    status: '-- complete',
    dateTime: currentDate,
  };

updateStock.put('/updateAvailableStock', async (req, res) => {
    const headers = {
        storename: process.env.zortstorename,
        apikey:  process.env.zortapikey,
        apisecret:  process.env.zortapisecret,
    };
    try {
      const response = await axios.post('https://open-api.zortout.com/v4/Product/UpdateProductAvailableStockList?warehousecode=W0001', req.body, {
        headers: headers,
        // params: warehousecode,
      });
      
        res.json(response.data)
      } catch (error) {
       res.status(500).json(error) 
      }
});  

module.exports = updateStock;    