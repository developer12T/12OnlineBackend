const express = require('express');
const updateOrderErp = express.Router();
const { Op, sequelize } = require('sequelize');
const axios = require('axios')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Order,OrderHis } = require('../model/Order')
const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
const { log } = require('console');
require('dotenv').config();
require('moment/locale/th');
// const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
const currentDate = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

updateOrderErp.put('/updateOrderErp', async (req, res) => {
    const number = req.body.number
    const sequelize = new Sequelize(process.env.databaseerp, process.env.user, process.env.password, {
        dialect: process.env.dialact,
        host: process.env.server, 
        });
        try {
                    const data = await Order.findAll({where:{number:number,status:'Voided'}}) ;
            
                    if(data.length > 0){
                    const query = `
                    UPDATE [dbo].[data_order] SET STATUS = '2' WHERE OAOREF = :value1 `;
                    
                    const replacements = {value1:number}
                    const result = await sequelize.query(query, {
                        replacements,
                        type: sequelize.QueryTypes.INSERT
                    });
                    res.json(result)
                    }else{
                        res.json({log:'Not Voided! Voided Only'})
                    }

        } catch (error) {
          console.log(error)
          res.json('Invalid data')
        }
}),

  module.exports = updateOrderErp
