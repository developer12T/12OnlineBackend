
const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
const addCustomer = express.Router();

// const orderDataZort = require('../dataZort/allOrder');

// const { Order, OrderDetail,OrderHis } = require('../../model/Order') ;
const { Customer,ShippingAddress } = require('../../model/Customer') ;
// const { orderMovement } = require('../model/Ordermovement') ;
// const { Product } = require('../model/Product')

require('moment/locale/th');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');

addCustomer.post('/addCustomer', async (req, res) => {
try {
   const data = req.body.dataOrder


    createddate = currentDate;
    const { customerid, customername, customercode ,customeridnumber,customeremail,customerphone,customeraddress,customerpostcode,customerprovince,customerdistrict,customersubdistrict,customerstreetAddress,customerbranchname,customerbranchno,facebookname,facebookid,line,lineid} = data;
    await  Customer.findOrCreate({where:{customerid:data.customerid},defaults:{...data,createddate:currentDate}})

  data.shi_customerid = data.customerid ;
  data.order_id = data.id
  const { shi_customerid,shippingname,shippingaddress,shippingphone,shippingemail,shippingpostcode,shippingprovince,shippingdistrict,shippingsubdistrict,shippingstreetAddress } = data ;
// await ShippingAddress.create(data);
await ShippingAddress.create({
    shi_customerid: data.customerid,
    order_id: data.id ,
    shippingname:data.shippingname ,
    shippingaddress: data.shippingaddress.substring(0, 255) ,
    shippingphone: data.shippingphone ,
    shippingemail: data.shippingemail ,
    shippingpostcode: data.shippingpostcode ,
    shippingprovince: data.shippingprovince ,
    shippingdistrict: data.shippingdistrict,
    shippingsubdistrict: data.shippingsubdistrict ,
    shippingstreetAddress: data.shippingstreetAddress ,
    }) 

    res.json(data)
    
} catch (error) {
    console.log(error)
    res.json(error)
}
})
module.exports = addCustomer;
