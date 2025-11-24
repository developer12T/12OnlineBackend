const express = require('express');
const addOnlineCustomerM3 = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
const axios = require('axios')
require('dotenv').config();

const { sequelize }  = require('../config/dbconnect')
addOnlineCustomerM3.post('/addOnlineCustomerM3', async (req, res) => {

        try {
                    const query = `EXEC [192.168.2.97].[DATA_ERP].[dbo].[addCustomerToM3]`;
                    const replacements = {}
                    const result = await sequelize.query(query, {
                        replacements,
                        type: sequelize.QueryTypes.INSERT
                    }); 

                    const token = jwt.sign(
                      { username: 'systemm3' },
                      process.env.TOKEN_KEY,
                      { expiresIn: '2h' }) 


                    
          res.json(result) 

        } catch (error) {
          console.log(error)
          res.json('Invalid data')
        }
}),

  module.exports = addOnlineCustomerM3
