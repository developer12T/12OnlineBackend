const express = require('express');
const addOrderM3 = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const axios = require('axios')
require('dotenv').config();

const { sequelize } = require('../config/dbconnect')
addOrderM3.post('/addOrderM3', async (req, res) => {

  try {
    const requestTimeout = 1 * 60 * 1000;
    const query = `EXEC [192.168.2.97].[DATA_ERP].[dbo].[addOrderToM3]`;
    const replacements = {}
    const result = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.INSERT,
      timeout: requestTimeout,
    });

    const token = jwt.sign(
      { username: 'systemm3' },
      process.env.TOKEN_KEY,
      { expiresIn: '2h' })


    // const response = await axios.post(process.env.API_URL + '/zort/order/OrderManage/getOrder12TIntoM3', { token: token, action: 'InsertM3', action2: 'moveorder' }, {});
    const response = await axios.post(
      process.env.API_URL + '/zort/order/OrderManage/getOrder12TIntoM3',
      { token: token, action: 'InsertM3', action2: 'moveorder' }
    );
    console.log('getOrder12TIntoM3:', response.data);
    res.json(result)

  } catch (error) {
    console.log(error)
    res.json('Invalid data')
  }
}),

  module.exports = addOrderM3
