
const express = require('express');
const moment = require('moment');

const { Op, where } = require('sequelize');
const axios = require('axios')
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const addOrderNew = express.Router();
const { sequelize } = require('../../config/database')
// const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail, OrderHis } = require('../../model/Order');
// const { Customer,ShippingAddress } = require('../model/Customer') ;
// const { orderMovement } = require('../model/Ordermovement') ;
// const { Product } = require('../model/Product')

// const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');

addOrderNew.post('/addOrderNew', async (req, res) => {
  try {
    const data = req.body.dataOrder

    const query = `
   INSERT INTO [dbo].[order] (id,[ordertype],[number],[customerid],[warehousecode],[status],[paymentstatus],[marketplacename],[marketplaceshippingstatus],[marketplacepayment],[amount],[vatamount] ,[shippingvat],[shippingchannel],
   [shippingamount],[shippingdate],[shippingdateString],[shippingname],[shippingaddress] ,[shippingphone] ,[shippingemail],[shippingpostcode],[shippingprovince],[shippingdistrict] ,[shippingsubdistrict],[shippingstreetAddress],
   [orderdate],[orderdateString],[paymentamount],[description],[discount],[platformdiscount],[sellerdiscount],[shippingdiscount],[discountamount],[voucheramount],[vattype],[saleschannel],[vatpercent],[isCOD],[createdatetime],
   [createdatetimeString],[updatedatetime],[updatedatetimeString],[expiredate],[expiredateString],[receivedate],[receivedateString],[totalproductamount],[uniquenumber],[properties],[isDeposit],[statusprint],[statusprintINV],[statusPrininvSuccess],[cono],[invno],[customeriderp]) 
   VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25,
   :value26,:value27,:value28,:value29,:value30,:value31,:value32,:value33,:value34,:value35,:value36,:value37,:value38,:value39,:value40,:value41,:value42,:value43,:value44,:value45,:value46,:value47,:value48,:value49,:value50,:value51,:value52,:value53,:value54,:value55,:value56,:value57,:value58)
   
   INSERT INTO [dbo].[orderMovement] (id, statusStock) VALUES (:value1, 0) 
   `;

    const rate = Number(data.vatpercent ?? 7) / 100;
    const gross = Number(data.totalproductamount) || 0;

    const vat = Number((gross - gross / (1 + rate)).toFixed(2));   // VAT amount
    const net = Number((gross / (1 + rate)).toFixed(2));            // Exclude VAT

    // value34: data.shippingdiscount 
    // value34: '' 
    const replacements = {
      value1: data.id, value11: data.amount, value21: data.shippingemail, value31: data.discount, value41: data.createdatetime, value51: data.properties,
      value2: data.ordertype, value12: vat, value22: data.shippingpostcode, value32: data.platformdiscount, value42: data.createdatetimeString, value52: data.isDeposit,
      value3: data.number, value13: data.shippingvat, value23: data.shippingprovince, value33: data.sellerdiscount, value43: data.updatedatetime, value53: '000',
      value4: data.customerid, value14: data.shippingchannel, value24: data.shippingdistrict, value34: '', value44: data.updatedatetimeString, value54: '',
      value5: data.warehousecode, value15: data.shippingamount, value25: data.shippingsubdistrict, value35: data.discountamount, value45: data.expiredate, value55: '000',
      value6: data.status, value16: data.shippingdate, value26: data.shippingstreetAddress, value36: data.voucheramount, value46: data.expiredateString, value56: 1,
      value7: data.paymentstatus, value17: data.shippingdateString, value27: data.orderdate, value37: data.vattype, value47: data.receivedate, value57: 1,
      value8: data.marketplacename, value18: data.shippingname, value28: data.orderdateString, value38: data.saleschannel, value48: data.receivedateString, value58: data.customercode,
      value9: data.marketplaceshippingstatus, value19: data.shippingaddress.substring(0, 255), value29: data.paymentamount, value39: data.vatpercent, value49: data.totalproductamount,
      value10: data.marketplacepayment, value20: data.shippingphone, value30: data.description, value40: data.isCOD, value50: data.uniquenumber,
    }
    
    const result = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.INSERT
    });


    if (data.tag === null) {

    } else {
      const query2 = `UPDATE [dbo].[order] SET [statusprintINV]  = 'TaxInvoice' WHERE id = ` + data.id + ``;

      const result2 = await sequelize.query(query2, {
        type: sequelize.QueryTypes.INSERT
      });
    }

    //  const orderDatup = await Order.findAll({where:{cono:1}})
    //       if(orderDatup == null){
    //       }else{
    //           for(let i=0;i<orderDatup.length;i++){
    //             var numberser = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries',{ 
    //              series:'ง',
    //              seriestype:'01', 
    //              companycode:410,
    //              seriesname:'071' 
    //             },{});
    //              var invser = await axios.post(process.env.API_URL+'/M3API/OrderManage/Order/getInvNumber',{ 
    //               ordertype:'071'
    //             },{});
    //             var invm3 = parseInt(invser.data[0].customerordno)
    //             const inv12T = await Order.findAll({attributes:['invno'],limit:1,order: [['invno', 'DESC']],})
    //           //   console.log(inv12T[0].invno);
    //             var inv12tcon = parseInt(inv12T[0].invno)
    //             if(invm3 > inv12tcon){
    //               var inNo = (parseInt(invser.data[0].customerordno) );
    //               var invnumber = inNo+1 ;
    //             }else{
    //               var inNo = (inv12tcon + 1);
    //               var invnumber = inNo ;
    //             }
    //             if(i == 0){
    //               var seNo = (numberser.data[0].lastno+1);  
    //             }else{
    //               var seNo = (numberser.data[0].lastno+i);  
    //             }
    //             var lastnumber = seNo ;
    //            const updateRun = await Order.update({cono:lastnumber,invno:invnumber},{where:{id:orderDatup[i].id}})
    //            var countUpdateorder = i
    //          } 
    //       }
    //       var updateNumber = await axios.post(process.env.API_URL+'/M3API/OrderManage/Order/updateNumberRunning',{ 
    //           series:'ง',
    //           seriestype:'01', 
    //           companycode:410,
    //           seriesname:'071',
    //           lastno:numberser.data[0].lastno+countUpdateorder
    //          }, {});

    res.json('lastnumber')

  } catch (error) {

    console.log(error)
    res.json('error')

  }
})
module.exports = addOrderNew;
