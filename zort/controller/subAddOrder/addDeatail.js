
const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const addDeatail = express.Router();
const _ = require('lodash');
// const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail, OrderHis } = require('../../model/Order');
const { Product } = require('../../model/Product')
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

      // ✅ เช็กก่อน insert ว่ามีอยู่ไหม
      const existDis = await OrderDetail.findOne({
        where: {
          id: data.id,
          productid: 8888888,
          sku: itemDisOnline.data[0].itemcode.trim() + '_PCS',
          numberOrder: data.number
        }
      });

      //  var seNo = (numberser.data[0].lastno+i);


      // await OrderDetail.create({
      //   id: data.id,
      //   numberOrder: data.number,
      //   productid: 8888888, //disonline
      //   name: itemDisOnline.data[0].itemname,
      //   sku: itemDisOnline.data[0].itemcode.trim() + '_PCS',
      //   number: 1,
      //   unittext: 'PCS',
      //   pricepernumber: data.sellerdiscount,
      //   totalprice: data.sellerdiscount
      // })
      if (!existDis) {
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
        });
      }

    }

    // ✅ ค่าขนส่ง (ทุกช่องทาง)
    const shippingSku = 'ZNS1401001_JOB';
    const shippingProductId = 9999999;

    if (
      (data.saleschannel === 'Lazada' && (data.shippingamount - data.discountamount) !== 0) ||
      ((data.saleschannel === 'Shopee' || data.saleschannel === 'Shopee Termtip' || data.saleschannel === 'TIKTOK') && data.shippingamount > 0)
    ) {
      const existShip = await OrderDetail.findOne({
        where: {
          id: data.id,
          productid: shippingProductId,
          sku: shippingSku,
          numberOrder: data.number
        }
      });

      if (!existShip) {
        await OrderDetail.create({
          id: data.id,
          numberOrder: data.number,
          productid: shippingProductId,
          name: 'ค่าขนส่ง',
          sku: shippingSku,
          number: 1,
          totalprice: data.shippingamount,
          pricepernumber: data.shippingamount,
          unittext: 'JOB'
        });
      }
    }

    // if (data.saleschannel == 'Lazada') {
    //   if ((data.shippingamount - data.discountamount) == 0) {

    //   } else {
    //     const existShip = await OrderDetail.findOne({
    //       where: {
    //         id: data.id,
    //         productid: shippingProductId,
    //         sku: shippingSku,
    //         numberOrder: data.number
    //       }
    //     });
    //     await OrderDetail.create({ id: data.id, numberOrder: data.number, productid: 9999999, name: 'ค่าขนส่ง', sku: 'ZNS1401001_JOB', number: 1, totalprice: data.shippingamount, pricepernumber: data.shippingamount, unittext: 'JOB' })
    //   }
    // } else if (data.saleschannel == 'Shopee' || data.saleschannel == 'Shopee Termtip') {
    //   if (data.shippingamount == 0) {

    //   } else {
    //     await OrderDetail.create({ id: data.id, numberOrder: data.number, productid: 9999999, name: 'ค่าขนส่ง', sku: 'ZNS1401001_JOB', number: 1, totalprice: data.shippingamount, pricepernumber: data.shippingamount, unittext: 'JOB' })
    //   }
    // } else if (data.saleschannel == 'TIKTOK') {
    //   if (data.shippingamount == 0) {

    //   } else {
    //     await OrderDetail.create({ id: data.id, numberOrder: data.number, productid: 9999999, name: 'ค่าขนส่ง', sku: 'ZNS1401001_JOB', number: 1, totalprice: data.shippingamount, pricepernumber: data.shippingamount, unittext: 'JOB' })
    //   }
    // }

    // group dup item
    let mergedData = {};

    data.list.forEach(item => {
      const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1
      const adjustedPrice =
        multiplier > 1
          ? Math.floor(item.pricepernumber / multiplier)
          : Math.floor(item.pricepernumber); // ✅ ensure integer
      // const key = `${item.productid}`;
      // const key = `${item.productid}_${item.sku}`;
      const key = `${item.productid}_${item.sku}_${item.pricepernumber}_${item.discount}`;
      if (!mergedData[key]) {
        mergedData[key] = {
          ...item,
          number: item.number * multiplier,
          pricepernumber: adjustedPrice
        };
      } else {
        mergedData[key].number += item.number * multiplier;
        mergedData[key].discountamount += item.discountamount;
        mergedData[key].pricepernumber_pretax += item.pricepernumber_pretax;
        mergedData[key].pricepernumber_vat += item.pricepernumber_vat;
        mergedData[key].totalprice += item.totalprice;
      }
    });



    // if (data.saleschannel == 'Shopee' || data.saleschannel == 'Shopee Termtip') {
    //   const productIds = Object.values(mergedData).map(i => i.productid);
    //   const products = await Product.findAll({
    //     where: {
    //       id: { [Op.in]: productIds }
    //     }
    //   });

    //   // สร้าง map สำหรับค้นหาเร็ว
    //   const productMap = _.keyBy(products, 'id');
    //   for (const key in mergedData) {
    //     const item = mergedData[key];
    //     const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1
    //     const product = productMap[item.productid];
    //     if (product) {
    //       item.totalprice = (product.sellprice * item.number) / multiplier;
    //       item.pricepernumber = product.sellprice / multiplier;
    //     }
    //   }
    // }


    // if (data.saleschannel == 'Shopee' || data.saleschannel == 'Shopee Termtip') {

    //   const mergedList = Object.values(mergedData);
    //   const totalAmount = mergedList.reduce(
    //     (sum, item) => sum + (Number(item.totalprice) || 0),
    //     0
    //   );

    //   // const vatamount = (totalAmount / 1.07).toFixed(2);
    //   // const vatamount = ((totalAmount - (totalAmount / 1.07))).toFixed(2)
    //   // const discountShoppe = (amount - totalAmount).toFixed(2)


    //   // await Order.update(
    //   //   {
    //   //     amount: totalAmount,
    //   //     vatamount: vatamount
    //   //   },
    //   //   {
    //   //     where: { id: data.id } // ✅ ใช้ id ของ order ปัจจุบัน
    //   //   }
    //   // );
    // }



    // แปลง object กลับเป็น array
    let mergedList = Object.values(mergedData);

    for (const item of mergedList) {
      const skuSuffix = item.sku?.substring(item.sku.lastIndexOf('_') + 1);
      const isFree = skuSuffix === 'Free';
      const isPremium = skuSuffix === 'Premium';

      if ((isFree || isPremium)
        && item.sku !== 'ZNS1401001'
        && item.productid !== '8888888'
      ) {
        item.procode = isFree ? 'FV2F' : 'FV2P';
        item.pricepernumber = 0;
        item.discount = 0;
        item.totalprice = 0;
        item.discountamount = 0;
      }
    }

    if (data.saleschannel == 'Shopee' || data.saleschannel == 'Shopee Termtip') {
      // convert productid to number
      const productIds = mergedList.map(i => Number(i.productid));

      // 2) ดึงข้อมูลสินค้าจากฐานข้อมูล
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } }
      });


      // 3) ทำ Map เพื่อค้นหาง่าย
      const productMap = _.keyBy(products, 'id');
      // 4) Loop mergedData แล้วสร้างราคาต้นตั้ง (original) + คำนวณส่วนต่าง
      // for (const key in mergedList) {
      //   const item = mergedList[key];
      //   const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1;
      //   const product = productMap[item.productid];

      //   if (product) {

      //     // ราคาต้นตั้งตามฐาน
      //     const originalTotalPrice = (product.sellprice * item.number) / multiplier;
      //     const originalPricePerNumber = product.sellprice / multiplier;

      //     // เก็บค่า original เข้า item
      //     item.originalTotalPrice = originalTotalPrice;
      //     item.originalPricePerNumber = originalPricePerNumber;

      //     // ราคาที่ส่งมาคือ item.totalprice (ของเดิม)
      //     const sentPrice = Number(item.totalprice) || 0;

      //     // ส่วนต่างของตัวนี้
      //     item.diff = originalTotalPrice - sentPrice;
      //   }
      // }
      // ใช้ for-of แทน
      for (const item of mergedList) {
        const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1;
        const product = productMap[Number(item.productid)];

        if (product) {
          item.originalTotalPrice = (product.sellprice * item.number) / multiplier;
          item.originalPricePerNumber = product.sellprice / multiplier;

          const sentPrice = Number(item.totalprice) || 0;
          item.diff = item.originalTotalPrice - sentPrice;
        }
      }

      // รวมราคาที่ส่งมา
      const totalAmount = mergedList.reduce(
        (sum, item) => sum + (Number(item.totalprice) || 0),
        0
      );

      // รวมราคาต้นตั้ง (original)
      const totalAmountOri = mergedList.reduce(
        (sum, item) => sum + (Number(item.originalTotalPrice) || 0),
        0
      );

      // หาส่วนต่างรวม
      const diffSummary = totalAmountOri - totalAmount;

      if (diffSummary > 0) {
        var itemDisOnline = await axios.post(process.env.API_URL + '/M3API/ItemManage/Item/getItemDisOnline', {
          itemtype: 'ZNS',
          itemcode: 'DISONLINE',
          companycode: 410,
        }, {});

        // ✅ เช็กก่อน insert ว่ามีอยู่ไหม
        const existDis = await OrderDetail.findOne({
          where: {
            id: data.id,
            productid: 8888888,
            sku: itemDisOnline.data[0].itemcode.trim() + '_PCS',
            numberOrder: data.number
          }
        });

        if (!existDis) {
          // let index = 1;
          // for (const item of mergedList) {
          //   item.itemNo = index++;
          // }
          await OrderDetail.create({
            id: data.id,
            numberOrder: data.number,
            productid: 8888888, //disonline
            name: itemDisOnline.data[0].itemname,
            sku: itemDisOnline.data[0].itemcode.trim() + '_PCS',
            number: 1,
            unittext: 'PCS',
            pricepernumber: diffSummary,
            totalprice: diffSummary
          });
        }
      }
    }

    function sanitizeInsertData(data) {
      const fieldsToNullIfArray = ['serialnolist', 'expirylotlist', 'skutype', 'bundleid', 'bundleitemid',
        'bundlenumber', 'bundleCode', 'bundleName', 'integrationItemId', 'integrationVariantId'];

      for (const field of fieldsToNullIfArray) {
        const val = data[field];

        if (Array.isArray(val)) {
          // แปลง array ให้เป็น string ถ้ามีค่า เช่น ['ABC','DEF'] → 'ABC,DEF'
          data[field] = val.length > 0 ? val.join(',') : null;
        } else if (typeof val === 'object' && val !== null) {
          data[field] = null;
        }
      }

      data.discount = Number(data.discount) || 0;
      data.discountamount = Number(data.discountamount) || 0;
      data.pricepernumber = Number(data.pricepernumber) || 0;
      data.totalprice = Number(data.totalprice) || 0;
      data.producttype = Number(data.producttype) || 0;
      data.number = Number(data.number) || 1;

      return data;
    }


    for (const list of mergedList) {
      let { auto_id, originalTotalPrice,
        diff,
        originalPricePerNumber, ...orderDatadetail } = list;
      orderDatadetail.id = data.id;
      orderDatadetail.numberOrder = data.number
      orderDatadetail.discount = Number(orderDatadetail.discount) || 0;
      // orderDatadetail.discount = data.discountamount+''

      console.log('==================test Group Data');
      console.log(orderDatadetail);


      const cleanData = sanitizeInsertData(orderDatadetail);
      await OrderDetail.create(cleanData);
      // await OrderDetail.bulkCreate([cleanData])



      // check sku update pro code _Free = FV2F , _Premium = FV2P
      // const listOrder = await OrderDetail.findAll({}, { numberOrder: data.number })
      // for (const listSub of listOrder) {
      //   if (listSub.sku.substring(listSub.sku.lastIndexOf('_') + 1) === 'Free') {
      //     await OrderDetail.update({ procode: 'FV2F', pricepernumber: 0, discount: 0, discountamount: 0 },
      //       {
      //         where: {
      //           sku: listSub.sku,
      //           numberOrder: listSub.numberOrder,
      //           totalprice: 0,
      //           sku: {
      //             [Op.ne]: 'ZNS1401001'
      //           },
      //           productid: {
      //             [Op.ne]: '8888888'
      //           }
      //         }
      //       })
      //   } else if (listSub.sku.substring(listSub.sku.lastIndexOf('_') + 1) === 'Premium') {

      //     await OrderDetail.update({ procode: 'FV2P', pricepernumber: 0, discount: 0, discountamount: 0 },
      //       {
      //         where: {
      //           sku: listSub.sku,
      //           numberOrder: listSub.numberOrder,
      //           totalprice: 0,
      //           sku: {
      //             [Op.ne]: 'ZNS1401001'
      //           },
      //           productid: {
      //             [Op.ne]: '8888888'
      //           }
      //         }
      //       })
      //   }
      // }
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
