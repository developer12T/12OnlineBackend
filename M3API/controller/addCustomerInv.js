const express = require('express');
const addCustomerInv = express.Router();
const { Op, sequelize } = require('sequelize');
const axios = require('axios')
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
require('dotenv').config();
require('moment/locale/th');
const { Customer } = require('../model/customer')
const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
// const currentDate = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

addCustomerInv.post('/getCustomerInv', async (req, res) => {
  const custype = req.body.customertype
  const cuscode = req.body.customercode
  try {
    var data = await Customer.findAll({
      attributes: {
        exclude: ['id'],
      },
      where: {
        customertype: custype,
        customercode: {
          [Op.like]: `%${cuscode}%`,
        }
      },
      limit: 1,
      order: [['OKCUNO', 'DESC']]
    });
    res.json(data)
  } catch (error) {
    console.log(error)
    res.json('Invalid data')
  }
}),

  addCustomerInv.post('/getCustomer', async (req, res) => {
    try {
      var data = await Customer.findAll({
        attributes: {
          exclude: ['id'],
        },
        where: {
          customertype: req.body.customertype,
          companycode: 410,
          area: {
            [Op.in]: ['BE211', 'BE212', 'BE213', 'BE214']
          },
        },
        order: [['OKCUNO', 'DESC']]
      });
      res.json(data)
    } catch (error) {
      console.log(error)
      res.json('Invalid data')
    }
  }),


  addCustomerInv.post('/addCustomerInvToERP', async (req, res) => {
    const sequelize = new Sequelize(process.env.databaseerp, process.env.user, process.env.password, {
      dialect: process.env.dialact,
      host: process.env.server,
    });

    try {

      const token = jwt.sign(
        { username: 'systemm3' },
        process.env.TOKEN_KEY,
        { expiresIn: '2h' })

      const response = await axios.post(process.env.API_URL + '/zort/rest12Tzort/12Trading/getCustomerToErp', { token: token }, {});


      for (const cus of response.data) {
        const query = `
            INSERT INTO [dbo].[data_customer] (
              companycode,customercode,customertype,searchkey,customername,address1,
              address2,address3,address4,phone,salecode,ordertype,
              warehouse,zone,payer,staticid,postcode,area1,route,
              area2,shoptype,taxno,provincecode,
              town,lat,long,channel,status,insert_at) 
            VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,
                :value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25,:value26,:value27,:value28,:value29)
            `;

        function splitAddressIntoArray(address, chunkSize) {
          const addressArray = [];
          for (let i = 0; i < address.length; i += chunkSize) {
            const chunk = address.substring(i, i + chunkSize);
            addressArray.push(chunk);
          }
          return addressArray;
        }

        const replacements = {
          value1: 410, value11: '11002', value21: '',
          value2: cus.customercode, value12: '071', value22: cus.customeridnumber,
          value3: '107', value13: '108', value23: '10',
          value4: cus.customername.substring(0, 10), value14: 'ON', value24: '',
          value5: cus.customername, value15: 'O00000001', value25: 0,
          value6: cus.customerstreetAddress.substring(0, 35), value16: '', value26: 0,
          value7: cus.customerdistrict, value17: cus.customerpostcode, value27: 1,
          value8: cus.customerprovince + cus.customerpostcode, value18: 'ON101', value28: 1,
          value9: '', value19: 'R', value29: currentDate,
          value10: cus.customerphone, value20: 'ON101',
        }
        const result = await sequelize.query(query, {
          replacements,
          type: sequelize.QueryTypes.INSERT
        });


      }

      res.json(response.data)
    } catch (error) {
      console.log(error)
      res.json('Invalid data')
    }



  }),

  module.exports = addCustomerInv
