
const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const addDeatail = express.Router();
const _ = require('lodash');
// const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail, OrderHis } = require('../../model/Order');
// const { Customer,ShippingAddress } = require('../model/Customer') ;
// const { orderMovement } = require('../model/Ordermovement') ;
// const { Product } = require('../model/Product')

// const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');

addDeatail.post('/addDeatail', async (req, res) => {
  try {
    const data = req.body.dataOrder

    if (data.sellerdiscount > 0) {

      var itemDisOnline = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItemDisOnline', {
        itemtype: 'ZNS',
        itemcode: 'DISONLINE',
        companycode: 410,

      }, {});

      //  var seNo = (numberser.data[0].lastno+i);

      await OrderDetail.create({
        id: data.id,
        numberOrder: data.number,
        productid: 8888888, //disonline
        name: itemDisOnline.data[0].itemname,
        sku: itemDisOnline.data[0].itemcode.trim() + '_PCS',
        number: 1,
        unittext: 'PCS',
        pricepernumber: data.sellerdiscount,
        totalprice: data.sellerdiscount
      })

    }


    if (data.saleschannel == 'Lazada') {
      if ((data.shippingamount - data.discountamount) == 0) {

      } else {
        await OrderDetail.create({ id: data.id, numberOrder: data.number, productid: 9999999, name: 'ค่าขนส่ง', sku: 'ZNS1401001_JOB', number: 1, totalprice: data.shippingamount, pricepernumber: data.shippingamount, unittext: 'JOB' })
      }
    } else if (data.saleschannel == 'Shopee' || data.saleschannel == 'Shopee Termtip') {
      if (data.shippingamount == 0) {

      } else {
        await OrderDetail.create({ id: data.id, numberOrder: data.number, productid: 9999999, name: 'ค่าขนส่ง', sku: 'ZNS1401001_JOB', number: 1, totalprice: data.shippingamount, pricepernumber: data.shippingamount, unittext: 'JOB' })
      }
    } else if (data.saleschannel == 'TIKTOK') {
      if (data.shippingamount == 0) {

      } else {
        await OrderDetail.create({ id: data.id, numberOrder: data.number, productid: 9999999, name: 'ค่าขนส่ง', sku: 'ZNS1401001_JOB', number: 1, totalprice: data.shippingamount, pricepernumber: data.shippingamount, unittext: 'JOB' })
      }
    }

    let mergedData = {};
    data.list.forEach(item => {
      const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1
      const key = `${item.productid}_${item.sku}`;
      if (!mergedData[key]) {
        mergedData[key] = { ...item };
      } else {
        mergedData[key].number += item.number * multiplier;
        mergedData[key].discountamount += item.discountamount;
        mergedData[key].pricepernumber_pretax += item.pricepernumber_pretax;
        mergedData[key].pricepernumber_vat += item.pricepernumber_vat;
        mergedData[key].totalprice += item.totalprice;
      }
    });

    // แปลง object กลับเป็น array
    let mergedList = Object.values(mergedData);

    console.log(mergedList);

    for (const list of mergedList) {
      // console.log(data.id) 
      let { auto_id, ...orderDatadetail } = list;
      orderDatadetail.id = data.id;
      orderDatadetail.numberOrder = data.number
      orderDatadetail.discount = data.discountamount + ''

      // console.log('=======================================================test Group Data');
      // console.log(orderDatadetail);



      await OrderDetail.bulkCreate([orderDatadetail])



      // check sku update pro code _Free = FV2F , _Premium = FV2P
      const listOrder = await OrderDetail.findAll({}, { numberOrder: data.number })
      for (const listSub of listOrder) {
        if (listSub.sku.substring(listSub.sku.lastIndexOf('_') + 1) === 'Free') {
          await OrderDetail.update({ procode: 'FV2F', pricepernumber: 0, discount: 0, discountamount: 0 },
            {
              where: {
                sku: listSub.sku,
                numberOrder: listSub.numberOrder,
                totalprice: 0,
                sku: {
                  [Op.ne]: 'ZNS1401001'
                },
                productid: {
                  [Op.ne]: '8888888'
                }
              }
            })
        } else if (listSub.sku.substring(listSub.sku.lastIndexOf('_') + 1) === 'Premium') {

          await OrderDetail.update({ procode: 'FV2P', pricepernumber: 0, discount: 0, discountamount: 0 },
            {
              where: {
                sku: listSub.sku,
                numberOrder: listSub.numberOrder,
                totalprice: 0,
                sku: {
                  [Op.ne]: 'ZNS1401001'
                },
                productid: {
                  [Op.ne]: '8888888'
                }
              }
            })
        }
      }
      // await OrderDetail.update({procode:'FV2F',pricepernumber:0,discount:0,discountamount:0},
      // {where:{
      //   totalprice:0,
      //   sku:{
      //     [Op.ne]:'ZNS1401001'
      //   },
      //   productid:{
      //     [Op.ne]:'8888888'
      //   }
      // }}) 

    }


    res.json(data)

  } catch (error) {
    console.log(error)
    res.json(error)
  }
})
module.exports = addDeatail;
