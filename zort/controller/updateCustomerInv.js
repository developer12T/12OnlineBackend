
const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const updateCustomerInv = express.Router();

// const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail, OrderHis } = require('../model/Order');
const { Customer, ShippingAddress } = require('../model/Customer');
const { orderMovement } = require('../model/Ordermovement');
const { Product } = require('../model/Product')

const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
updateCustomerInv.put('/updateCustomerInv', async (req, res) => {
  try {

    const sequelize = new Sequelize('DATA_ERP', 'sa', 'P@ssw0rd', {
      dialect: 'mssql',
      host: '192.168.2.97',
    });

    const data = await req.body.dataOrder
    // res.json(data)
    const orderTaxLazada = []
    const orderTaxShopee = []
    const orderTaxTikTok = []
    const orderTaxMakro = []
    const orderTaxAmaze = []

    for (const item of data) {
      if (item.saleschannel === "Lazada") {
        orderTaxLazada.push(item)
      } else if (item.saleschannel === "Shopee" || item.saleschannel === "Shopee Termtip") {
        orderTaxShopee.push(item)
      } else if (item.saleschannel === "TIKTOK") {
        orderTaxTikTok.push(item)
      } else if (item.saleschannel === "Makro") {
        orderTaxMakro.push(item)
      }
      else if (item.saleschannel === "Amaze") {
        orderTaxAmaze.push(item)
      }
    }

    if (orderTaxLazada.length > 0) {
      for (let i = 0; i < orderTaxLazada.length; i++) {
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getCustomerInv', {
          customertype: '107',
          customercode: 'OLAZ'
        }, {
          headers: {
          },
        });

        function incrementCustomerCode(code) {
          let number = parseInt(code, 10) + 1;
          let newCode = number.toString();
          while (newCode.length < code.length) {
            newCode = '0' + newCode;
          }
          return newCode;
        }

        const restdata = response.data[0];
        const customerCode = restdata.customercode;
        const numericPart = customerCode.slice(4);
        const newNumericPart = incrementCustomerCode(numericPart);
        const newCustomerCode = 'OLAZ' + newNumericPart;

        // const updatetozort = await axios.post(process.env.UpdateContact+`?id=60327271`,{code:'OSPE003008'}, {


        // const addressArray = new Array(4).fill('');
        const chunk1 = orderTaxLazada[i].customeraddress.substring(0, 35);
        const chunk2 = orderTaxLazada[i].customeraddress.substring(35, 70);
        const chunk3 = orderTaxLazada[i].customeraddress.substring(70, 105);
        const chunk4 = orderTaxLazada[i].customername.substring(35, 70);

        const shchunk1 = orderTaxLazada[i].shippingaddress.substring(0, 35);
        const shchunk2 = orderTaxLazada[i].shippingaddress.substring(35, 70);
        const shchunk3 = orderTaxLazada[i].shippingaddress.substring(70, 105);
        const shchunk4 = orderTaxLazada[i].shippingaddress.substring(105, 140);

        //edit by woraphat 14/03/2024 -- start : 15:31 
        const idCus = await Customer.findAll({ where: { customerid: orderTaxLazada[i].customerid } })
        console.log(idCus.length);
        if (idCus.length > 0) {
          console.log('check replace::' + orderTaxLazada[i].customerid);
          //edit
          await Customer.destroy({
            where: {
              customerid: orderTaxLazada[i].customerid,
              customercode: 'OLAZ000000'
            },
          });
          //edit
        } else {
          const query = `
                  INSERT INTO [dbo].[data_customer] (
                    companycode,customercode,customertype,searchkey,customername,address1,
                    address2,address3,address4,phone,salecode,ordertype,
                    warehouse,zone,payer,postcode,area,route,
                   shoptype,taxno,provincecode,
                    town,channel,status,insert_at) 
                  VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,
                  :value16,:value18,:value19,:value21,:value22,:value23,:value24,:value27,:value28,:value29)
  
                  INSERT INTO [dbo].[data_address] (companycode,customercode,address1,address2,address3,address4, postcode,
                                                      provincecode,phone,taxno) 
                        VALUES (:value1,:value2,:value30,:value31,:value32,:value33,:value34,:value23,:value36,:value22)
                  
                  `;


          const replacements = {
            value1: 410, value2: newCustomerCode, value3: '107', value4: orderTaxLazada[i].customername.substring(0, 10), value5: orderTaxLazada[i].customername.substring(0, 34),
            value6: chunk1, value7: chunk2, value8: chunk3, value9: chunk4, value10: orderTaxLazada[i].customerphone,
            value11: '11002', value12: '071', value13: '108', value14: 'ON', value15: 'O00000001',
            value16: orderTaxLazada[i].customerpostcode, value18: 'ON101', value19: 'R',
            value21: '', value22: orderTaxLazada[i].customeridnumber.substring(0, 13), value23: orderTaxLazada[i].customerpostcode.substring(0, 2), value24: '',
            value27: 'ONLINE', value28: 0, value29: currentDate, value30: shchunk1,
            value31: shchunk2, value32: shchunk3, value33: shchunk4, value34: orderTaxLazada[i].shippingpostcode, value35: orderTaxLazada[i].shippingpostcode,
            value36: orderTaxLazada[i].shippingphone,
          }
          const result = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
          });
          console.log(result);
          const addCusm3 = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOnlineCustomerM3', {}, {});
          const updatetozort = await axios.post(process.env.UpdateContact + `?id=${orderTaxLazada[i].customerid}`, { code: newCustomerCode }, {
            headers: {
              storename: process.env.zortstorename,
              apikey: process.env.zortapikey,
              apisecret: process.env.zortapisecret,

            },
          });
        }

      }

      // res.json(orderTaxLazada)
    } else if (orderTaxShopee.length > 0) {
      for (let i = 0; i < orderTaxShopee.length; i++) {
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getCustomerInv', {
          customertype: '107',
          customercode: 'OSPE'
        }, {
          headers: {
          },
        });

        function incrementCustomerCode(code) {
          let number = parseInt(code, 10) + 1;
          let newCode = number.toString();
          while (newCode.length < code.length) {
            newCode = '0' + newCode;
          }
          return newCode;
        }

        const restdata = response.data[0];
        const customerCode = restdata.customercode;
        const numericPart = customerCode.slice(4);
        const newNumericPart = incrementCustomerCode(numericPart);
        const newCustomerCode = 'OSPE' + newNumericPart;

        // const updatetozort = await axios.post(process.env.UpdateContact+`?id=60327271`,{code:'OSPE003008'}, {


        // const addressArray = new Array(4).fill('');
        const chunk1 = orderTaxShopee[i].customeraddress.substring(0, 35);
        const chunk2 = orderTaxShopee[i].customeraddress.substring(35, 70);
        const chunk3 = orderTaxShopee[i].customeraddress.substring(70, 105);
        const chunk4 = orderTaxShopee[i].customername.substring(35, 69);

        const shchunk1 = orderTaxShopee[i].shippingaddress.substring(0, 35);
        const shchunk2 = orderTaxShopee[i].shippingaddress.substring(35, 70);
        const shchunk3 = orderTaxShopee[i].shippingaddress.substring(70, 105);
        const shchunk4 = orderTaxShopee[i].shippingaddress.substring(105, 140);

        const idCus = await Customer.findAll({ where: { customerid: orderTaxShopee[i].customerid } })
        console.log(idCus.length);
        if (idCus.length > 0) {
          console.log('not work');
        } else {
          const query = `
                INSERT INTO [dbo].[data_customer] (
                  companycode,customercode,customertype,searchkey,customername,address1,
                  address2,address3,address4,phone,salecode,ordertype,
                  warehouse,zone,payer,postcode,area,route,
                 shoptype,taxno,provincecode,
                  town,channel,status,insert_at) 
                VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,
                :value16,:value18,:value19,:value21,:value22,:value23,:value24,:value27,:value28,:value29)

                INSERT INTO [dbo].[data_address] (companycode,customercode,address1,address2,address3,address4, postcode,
                                                    provincecode,phone,taxno) 
                      VALUES (:value1,:value2,:value30,:value31,:value32,:value33,:value34,:value23,:value36,:value22)
                
                `;

          const replacements = {
            value1: 410, value2: newCustomerCode, value3: '107', value4: orderTaxShopee[i].customername.substring(0, 10), value5: orderTaxShopee[i].customername.substring(0, 34),
            value6: chunk1, value7: chunk2, value8: chunk3, value9: chunk4, value10: orderTaxShopee[i].customerphone,
            value11: '11002', value12: '071', value13: '108', value14: 'ON', value15: 'O00000001',
            value16: orderTaxShopee[i].customerpostcode, value18: 'ON101', value19: 'R',
            value21: '', value22: orderTaxShopee[i].customeridnumber.substring(0, 13), value23: orderTaxShopee[i].customerpostcode.substring(0, 2), value24: '',
            value27: 'ONLINE', value28: 0, value29: currentDate, value30: shchunk1,
            value31: shchunk2, value32: shchunk3, value33: shchunk4, value34: orderTaxShopee[i].shippingpostcode, value35: orderTaxShopee[i].shippingpostcode,
            value36: orderTaxShopee[i].shippingphone,
          }
          const result = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
          });

          const addCusm3 = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOnlineCustomerM3', {}, {});
          const updatetozort = await axios.post(process.env.UpdateContact + `?id=${orderTaxShopee[i].customerid}`, { code: newCustomerCode }, {
            headers: {
              storename: process.env.zortstorename,
              apikey: process.env.zortapikey,
              apisecret: process.env.zortapisecret,

            },
          });

        }

      }
      // res.json(orderTaxShopee)
    } else if (orderTaxTikTok.length > 0) {
      for (let i = 0; i < orderTaxTikTok.length; i++) {
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getCustomerInv', {
          customertype: '107',
          customercode: 'OTIK'
        }, {
          headers: {
          },
        });

        function incrementCustomerCode(code) {
          let number = parseInt(code, 10) + 1;
          let newCode = number.toString();
          while (newCode.length < code.length) {
            newCode = '0' + newCode;
          }
          return newCode;
        }

        const restdata = response.data[0];
        const customerCode = restdata.customercode;
        const numericPart = customerCode.slice(4);
        const newNumericPart = incrementCustomerCode(numericPart);
        const newCustomerCode = 'OTIK' + newNumericPart;

        // const updatetozort = await axios.post(process.env.UpdateContact+`?id=60327271`,{code:'OSPE003008'}, {


        // const addressArray = new Array(4).fill('');
        const chunk1 = orderTaxTikTok[i].customeraddress.substring(0, 35);
        const chunk2 = orderTaxTikTok[i].customeraddress.substring(35, 70);
        const chunk3 = orderTaxTikTok[i].customeraddress.substring(70, 105);
        const chunk4 = orderTaxTikTok[i].customername.substring(35, 69);

        const shchunk1 = orderTaxTikTok[i].shippingaddress.substring(0, 35);
        const shchunk2 = orderTaxTikTok[i].shippingaddress.substring(35, 70);
        const shchunk3 = orderTaxTikTok[i].shippingaddress.substring(70, 105);
        const shchunk4 = orderTaxTikTok[i].shippingaddress.substring(105, 140);

        const idCus = await Customer.findAll({ where: { customerid: orderTaxTikTok[i].customerid } })
        console.log(idCus.length);
        if (idCus.length > 0) {
          console.log('not work');
        } else {
          const query = `
                   INSERT INTO [dbo].[data_customer] (
                     companycode,customercode,customertype,searchkey,customername,address1,
                     address2,address3,address4,phone,salecode,ordertype,
                     warehouse,zone,payer,postcode,area,route,
                    shoptype,taxno,provincecode,
                     town,channel,status,insert_at) 
                   VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,
                   :value16,:value18,:value19,:value21,:value22,:value23,:value24,:value27,:value28,:value29)
   
                   INSERT INTO [dbo].[data_address] (companycode,customercode,address1,address2,address3,address4, postcode,
                                                       provincecode,phone,taxno) 
                         VALUES (:value1,:value2,:value30,:value31,:value32,:value33,:value34,:value23,:value36,:value22)
                   
                   `;

          const replacements = {
            value1: 410, value2: newCustomerCode, value3: '107', value4: orderTaxTikTok[i].customername.substring(0, 10), value5: orderTaxTikTok[i].customername.substring(0, 34),
            value6: chunk1, value7: chunk2, value8: chunk3, value9: chunk4, value10: orderTaxTikTok[i].customerphone,
            value11: '11002', value12: '071', value13: '108', value14: 'ON', value15: 'O00000001',
            value16: orderTaxTikTok[i].customerpostcode, value18: 'ON101', value19: 'R',
            value21: '', value22: orderTaxTikTok[i].customeridnumber.substring(0, 13), value23: orderTaxTikTok[i].customerpostcode.substring(0, 2), value24: '',
            value27: 'ONLINE', value28: 0, value29: currentDate, value30: shchunk1,
            value31: shchunk2, value32: shchunk3, value33: shchunk4, value34: orderTaxTikTok[i].shippingpostcode, value35: orderTaxTikTok[i].shippingpostcode,
            value36: orderTaxTikTok[i].shippingphone,
          }
          const result = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
          });

          const addCusm3 = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOnlineCustomerM3', {}, {});
          const updatetozort = await axios.post(process.env.UpdateContact + `?id=${orderTaxTikTok[i].customerid}`, { code: newCustomerCode }, {
            headers: {
              storename: process.env.zortstorename,
              apikey: process.env.zortapikey,
              apisecret: process.env.zortapisecret,

            },
          });

        }

      }
      // res.json(orderTaxShopee)
    }
    // else if (orderTaxMakro.length > 0) {
    //   for (let i = 0; i < orderTaxMakro.length; i++) {
    //     const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getCustomerInv', {
    //       customertype: '107',
    //       customercode: 'OMKP'
    //     }, {
    //       headers: {
    //       },
    //     });

    //     function incrementCustomerCode(code) {
    //       let number = parseInt(code, 10) + 1;
    //       let newCode = number.toString();
    //       while (newCode.length < code.length) {
    //         newCode = '0' + newCode;
    //       }
    //       return newCode;
    //     }

    //     const restdata = response.data[0];
    //     const customerCode = restdata.customercode;
    //     const numericPart = customerCode.slice(4);
    //     const newNumericPart = incrementCustomerCode(numericPart);
    //     const newCustomerCode = 'OMKP' + newNumericPart;

    //     // const updatetozort = await axios.post(process.env.UpdateContact+`?id=60327271`,{code:'OSPE003008'}, {


    //     // const addressArray = new Array(4).fill('');
    //     const chunk1 = orderTaxMakro[i].customeraddress.substring(0, 35);
    //     const chunk2 = orderTaxMakro[i].customeraddress.substring(35, 70);
    //     const chunk3 = orderTaxMakro[i].customeraddress.substring(70, 105);
    //     const chunk4 = orderTaxMakro[i].customername.substring(35, 69);

    //     const shchunk1 = orderTaxMakro[i].shippingaddress.substring(0, 35);
    //     const shchunk2 = orderTaxMakro[i].shippingaddress.substring(35, 70);
    //     const shchunk3 = orderTaxMakro[i].shippingaddress.substring(70, 105);
    //     const shchunk4 = orderTaxMakro[i].shippingaddress.substring(105, 140);

    //     const idCus = await Customer.findAll({ where: { customeriderp: orderTaxMakro[i].customerid } })
    //     console.log(idCus.length);
    //     if (idCus.length > 0) {
    //       console.log('not work');
    //     } else {
    //       const query = `
    //                INSERT INTO [dbo].[data_customer] (
    //                  companycode,customercode,customertype,searchkey,customername,address1,
    //                  address2,address3,address4,phone,salecode,ordertype,
    //                  warehouse,zone,payer,postcode,area,route,
    //                 shoptype,taxno,provincecode,
    //                  town,channel,status,insert_at) 
    //                VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,
    //                :value16,:value18,:value19,:value21,:value22,:value23,:value24,:value27,:value28,:value29)

    //                INSERT INTO [dbo].[data_address] (companycode,customercode,address1,address2,address3,address4, postcode,
    //                                                    provincecode,phone,taxno) 
    //                      VALUES (:value1,:value2,:value30,:value31,:value32,:value33,:value34,:value23,:value36,:value22)

    //                `;

    //       const replacements = {
    //         value1: 410, value2: newCustomerCode, value3: '107', value4: orderTaxMakro[i].customername.substring(0, 10), value5: orderTaxMakro[i].customername.substring(0, 34),
    //         value6: chunk1, value7: chunk2, value8: chunk3, value9: chunk4, value10: orderTaxMakro[i].customerphone,
    //         value11: '11002', value12: '071', value13: '108', value14: 'ON', value15: 'O00000001',
    //         value16: orderTaxMakro[i].customerpostcode, value18: 'ON101', value19: 'R',
    //         value21: '', value22: orderTaxMakro[i].customeridnumber.substring(0, 13), value23: orderTaxMakro[i].customerpostcode.substring(0, 2), value24: '',
    //         value27: 'ONLINE', value28: 0, value29: currentDate, value30: shchunk1,
    //         value31: shchunk2, value32: shchunk3, value33: shchunk4, value34: orderTaxMakro[i].shippingpostcode, value35: orderTaxMakro[i].shippingpostcode,
    //         value36: orderTaxMakro[i].shippingphone,
    //       }
    //       const result = await sequelize.query(query, {
    //         replacements,
    //         type: sequelize.QueryTypes.INSERT
    //       });

    //       const addCusm3 = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOnlineCustomerM3', {}, {});
    //       // const updatetozort = await axios.post(process.env.UpdateContact + `?id=${orderTaxMakro[i].customerid}`, { code: newCustomerCode }, {
    //       //   headers: {
    //       //     storename: process.env.zortstorename,
    //       //     apikey: process.env.zortapikey,
    //       //     apisecret: process.env.zortapisecret,

    //       //   },
    //       // });

    //     }

    //   }
    //   // res.json(orderTaxShopee)
    // } 
    else if (orderTaxMakro.length > 0) {
      let updatedCustomers = [];

      for (let i = 0; i < orderTaxMakro.length; i++) {
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getCustomerInv', {
          customertype: '107',
          customercode: 'OMKP'
        });

        function incrementCustomerCode(code) {
          let number = parseInt(code, 10) + 1;
          let newCode = number.toString();
          while (newCode.length < code.length) {
            newCode = '0' + newCode;
          }
          return newCode;
        }

        const restdata = response.data[0];
        const customerCode = restdata.customercode;
        const numericPart = customerCode.slice(4);
        const newNumericPart = incrementCustomerCode(numericPart);
        const newCustomerCode = 'OMKP' + newNumericPart;

        // console.log('response', response)
        // console.log('restdata', restdata)
        // console.log('newCustomerCode', newCustomerCode)
        const chunk1 = orderTaxMakro[i].customeraddress.substring(0, 35);
        const chunk2 = orderTaxMakro[i].customeraddress.substring(35, 70);
        const chunk3 = orderTaxMakro[i].customeraddress.substring(70, 105);
        const chunk4 = orderTaxMakro[i].customername.substring(35, 69);

        const shchunk1 = orderTaxMakro[i].shippingaddress.substring(0, 35);
        const shchunk2 = orderTaxMakro[i].shippingaddress.substring(35, 70);
        const shchunk3 = orderTaxMakro[i].shippingaddress.substring(70, 105);
        const shchunk4 = orderTaxMakro[i].shippingaddress.substring(105, 140);

        const idCus = await Customer.findAll({
          where: {
            customeriderp: orderTaxMakro[i].customerid,
            customercode: { [Op.or]: [null, ""] }
          }
        });
        if (idCus.length > 0) {

          const query = `
              INSERT INTO [dbo].[data_customer] (
                  companycode, customercode, customertype, searchkey, customername, address1,
                  address2, address3, address4, phone, salecode, ordertype,
                  warehouse, zone, payer, postcode, area, route,
                  shoptype, taxno, provincecode,
                  town, channel, status, insert_at) 
              VALUES (:value1, :value2, :value3, :value4, :value5, :value6, :value7, :value8, :value9, :value10, :value11, :value12, :value13, :value14, :value15,
                      :value16, :value18, :value19, :value21, :value22, :value23, :value24, :value27, :value28, :value29);
      
              INSERT INTO [dbo].[data_address] (companycode, customercode, address1, address2, address3, address4, postcode,
                                                provincecode, phone, taxno) 
              VALUES (:value1, :value2, :value30, :value31, :value32, :value33, :value34, :value23, :value36, :value22);
          `;

          const replacements = {
            value1: 410, value2: newCustomerCode, value3: '107', value4: orderTaxMakro[i].customername.substring(0, 10),
            value5: orderTaxMakro[i].customername.substring(0, 34), value6: chunk1, value7: chunk2, value8: chunk3,
            value9: chunk4, value10: orderTaxMakro[i].customerphone, value11: '11002', value12: '071', value13: '108',
            value14: 'ON', value15: 'O00000001', value16: orderTaxMakro[i].customerpostcode, value18: 'ON101',
            value19: 'R', value21: '', value22: orderTaxMakro[i].customeridnumber.substring(0, 13),
            value23: orderTaxMakro[i].customerpostcode.substring(0, 2), value24: '', value27: 'ONLINE',
            value28: 0, 
            value29: moment().format('YYYY-MM-DD'), 
            value30: shchunk1, 
            value31: shchunk2,
            value32: shchunk3, 
            value33: shchunk4, 
            value34: orderTaxMakro[i].shippingpostcode,
            value35: orderTaxMakro[i].shippingpostcode, 
            value36: orderTaxMakro[i].customerphone
          };

          await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
          });

          const addCusm3 = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOnlineCustomerM3', {}, {});

          updatedCustomers.push({
            orderid: orderTaxMakro[i].orderid,
            customerid: orderTaxMakro[i].customerid,
            newCustomerCode: newCustomerCode
          });

        }

      }
      // console.log('update', updatedCustomers)

      if (updatedCustomers.length > 0) {
        for (const updatedCustomer of updatedCustomers) {
          await Customer.update(
            { customercode: updatedCustomer.newCustomerCode },
            { where: { customeriderp: updatedCustomer.customerid } }
          );

          await Order.update(
            { customeriderp: updatedCustomer.newCustomerCode },
            { where: { id: updatedCustomer.orderid } }
          );
        }

      }

      // res.json({
      //   message: "Makro customer update completed",
      //   updatedCustomers
      // });
    } else if (orderTaxAmaze.length > 0) {
      console.log('update amaze cus')
      let updatedCustomers = [];

      for (let i = 0; i < orderTaxAmaze.length; i++) {
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getCustomerInv', {
          customertype: '107',
          customercode: 'OAMZ'
        });

        function incrementCustomerCode(code) {
          let number = parseInt(code, 10) + 1;
          let newCode = number.toString();
          while (newCode.length < code.length) {
            newCode = '0' + newCode;
          }
          return newCode;
        }

        const restdata = response.data[0];
        const customerCode = restdata.customercode;
        const numericPart = customerCode.slice(4);
        const newNumericPart = incrementCustomerCode(numericPart);
        const newCustomerCode = 'OAMZ' + newNumericPart;

        // console.log('response', response)
        // console.log('restdata', restdata)
        // console.log('newCustomerCode', newCustomerCode)
        const chunk1 = orderTaxAmaze[i].customeraddress.substring(0, 35);
        const chunk2 = orderTaxAmaze[i].customeraddress.substring(35, 70);
        const chunk3 = orderTaxAmaze[i].customeraddress.substring(70, 105);
        const chunk4 = orderTaxAmaze[i].customername.substring(35, 69);

        const shchunk1 = orderTaxAmaze[i].shippingaddress.substring(0, 35);
        const shchunk2 = orderTaxAmaze[i].shippingaddress.substring(35, 70);
        const shchunk3 = orderTaxAmaze[i].shippingaddress.substring(70, 105);
        const shchunk4 = orderTaxAmaze[i].shippingaddress.substring(105, 140);

        const idCus = await Customer.findAll({
          where: {
            customeriderp: orderTaxAmaze[i].customerid,
            customercode: { [Op.or]: [null, ""] }
          }
        });
        if (idCus.length > 0) {

          const query = `
              INSERT INTO [dbo].[data_customer] (
                  companycode, customercode, customertype, searchkey, customername, address1,
                  address2, address3, address4, phone, salecode, ordertype,
                  warehouse, zone, payer, postcode, area, route,
                  shoptype, taxno, provincecode,
                  town, channel, status, insert_at) 
              VALUES (:value1, :value2, :value3, :value4, :value5, :value6, :value7, :value8, :value9, :value10, :value11, :value12, :value13, :value14, :value15,
                      :value16, :value18, :value19, :value21, :value22, :value23, :value24, :value27, :value28, :value29);
      
              INSERT INTO [dbo].[data_address] (companycode, customercode, address1, address2, address3, address4, postcode,
                                                provincecode, phone, taxno) 
              VALUES (:value1, :value2, :value30, :value31, :value32, :value33, :value34, :value23, :value36, :value22);
          `;

          const replacements = {
            value1: 410, value2: newCustomerCode, value3: '107', value4: orderTaxAmaze[i].customername.substring(0, 10),
            value5: orderTaxAmaze[i].customername.substring(0, 34), value6: chunk1, value7: chunk2, value8: chunk3,
            value9: chunk4, value10: orderTaxAmaze[i].customerphone, value11: '11002', value12: '071', value13: '108',
            value14: 'ON', value15: 'O00000001', value16: orderTaxAmaze[i].customerpostcode, value18: 'ON101',
            value19: 'R', value21: '', value22: orderTaxAmaze[i].customeridnumber.substring(0, 13),
            value23: orderTaxAmaze[i].customerpostcode.toString().substring(0, 2), value24: '', value27: 'ONLINE',
            value28: 0, 
            value29: moment().format('YYYY-MM-DD'), 
            value30: shchunk1, 
            value31: shchunk2,
            value32: shchunk3, 
            value33: shchunk4, 
            value34: orderTaxAmaze[i].shippingpostcode,
            value35: orderTaxAmaze[i].shippingpostcode, 
            value36: orderTaxAmaze[i].customerphone
          };

          await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.INSERT
          });

          const addCusm3 = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/addOnlineCustomerM3', {}, {});

          updatedCustomers.push({
            orderid: orderTaxAmaze[i].orderid,
            customerid: orderTaxAmaze[i].customerid,
            newCustomerCode: newCustomerCode
          });

        }

      }
       console.log('update', updatedCustomers)

      if (updatedCustomers.length > 0) {
        for (const updatedCustomer of updatedCustomers) {
          await Customer.update(
            { customercode: updatedCustomer.newCustomerCode },
            { where: { customeriderp: updatedCustomer.customerid } }
          );

          await Order.update(
            { customeriderp: updatedCustomer.newCustomerCode },
            { where: { id: updatedCustomer.orderid } }
          );
        }

      }

      // res.json({
      //   message: "Makro customer update completed",
      //   updatedCustomers
      // });
    }


    res.json('success')

  } catch (error) {
    console.log(error)
    res.json(error)
  }
})
module.exports = updateCustomerInv;
