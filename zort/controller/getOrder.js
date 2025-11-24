const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
// const axios = require('axios'); 
const getOrder = express.Router();

// const fs = require('fs') ;
// const os = require('os');

const orderDataZort = require('../dataZort/allOrder');

require('moment/locale/th');

getOrder.post('/getOrder', async (req, res) => {
    try {
        const data = await orderDataZort();
        res.status(200).json(data);
     } catch (error) {
       console.error(error);
       res.status(500).json({ message: 'An error occurred while fetching the data.' });
     }

  });  

module.exports = getOrder;    