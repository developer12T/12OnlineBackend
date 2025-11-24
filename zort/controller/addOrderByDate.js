const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const addOrder = express.Router();
const jwt = require('jsonwebtoken');
const pm2 = require('pm2')
const orderDataZort = require('../dataZort/allOrder');

const { Order, OrderDetail, OrderHis } = require('../model/Order');
const { Customer, ShippingAddress } = require('../model/Customer');
const { orderMovement } = require('../model/Ordermovement');
const { Product } = require('../model/Product')
const { logTable } = require('../model/Logtable')

const { sequelize } = require('../config/database');
require('moment/locale/th');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
let createdCount = 0;
let createdShipCount = 0;
let updatedCount = 0;
const response = {
  status: '-- complete',
  dateTime: currentDate,
};


addOrder.put('/addOrderBydate', async (req, res) => {
  const headers = {
    storename: process.env.zortstorename,
    apikey: process.env.zortapikey,
    apisecret: process.env.zortapisecret,
  };
  try {

    // 1. ไปเรียกข้อมูลจาก Zort 
    const datapre = await orderDataZort();
    // const datapre = {
    //   "res": {
    //       "resCode": "200",
    //       "resDesc": "",
    //       "resDesc2": null,
    //       "resDesc3": null,
    //       "detail": null
    //    },
    //    "list": [{}]
    //    }
    //2. อัปเดต ข้อมูลที่ได้มาจาก zort เพื่อปรับให้ lazada เหมือนกับ shopee
    const updatedData = datapre.list.map(data => {
      if (data.saleschannel === "Lazada" && (!data.tag || data.tag === "")) {
        data.customercode = "OLAZ000000"
      } else if (data.saleschannel === "TIKTOK" && (!data.tag || data.tag === "")) {
        data.customercode = "OTIK000000"
      }
      return data;
    });

    //3. ตัวแปรที่จะมาเก็บ รายการใหม่ ที่ไม่มีใน his และ order
    const filteredDataList = [];

    //4. กรองข้อมูล ที่มี id ใน orderhis อยู่แล้วออก
    const existingIds = (await OrderHis.findAll()).map(item => item.id);
    const newDataList = updatedData.filter(item => !existingIds.includes(item.id));

    const existingNumbers = (await OrderHis.findAll()).map(item => item.number);
    const newDataListOutNumber = newDataList.filter(item => !existingNumbers.includes(item.number));

    //5. กรองข้อมูล ที่มี id ใน order อยู่แล้วออก
    // const existingIdsOrder = (await Order.findAll()).map(item => item.id);
    // const newDataListOrder = newDataList.filter(item => !existingIdsOrder.includes(item.id));

    const existingIdsOrder = (await Order.findAll()).map(item => item.id);
    const newDataListOrderOutid = newDataListOutNumber.filter(item => !existingIdsOrder.includes(item.id));

    const existingNumbersOrder = (await Order.findAll()).map(item => item.number);
    const newDataListOrder = newDataListOrderOutid.filter(item => !existingNumbersOrder.includes(item.number));

    //6.ตัวแปรที่จะมาเก็บ ออเดอที่ไม่มี customercode 
    const orderTaxShopee = [];

    //7. ทำการแยก ออเดอ ระหว่าง มี customercode และไม่มี customercode แต่ ยังเอา id ที่มีใน order มาใช้และ insert
    for (const item of newDataListOrder) {
      if (item.customercode === "") {
        if (item.status !== "Voided") {
          orderTaxShopee.push(item)
        } else {

        }

      } else {
        if (item.status !== "Voided") {
          filteredDataList.push(item);
        } else {

        }

      }
    }

    //8.สร้างตัวแปร token มาเพื่อใช้ยิงไปที่ updatecustomer
    const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, { expiresIn: '2h' })

    //9. เอาตัวแปรที่ได้จาก 4. มาใช้ เพื่อ ให้ customercode ออเดอ อัพเดตใหม่
    const response = await axios.put(process.env.API_URL + `/zort/customer/CustomerManage/updateCustomerInv?token=${token}`, { dataOrder: orderTaxShopee }, {});

    //10. กำหนด data2 ให้เท่ากับ order ใหม่
    const data2 = filteredDataList;

    if (data2.length > 0) {
      //11. ถ้ามีออเดอใหม่เข้ามา ให้ insert order และ orderDetail ของ order นั้น 
      for (const addOrderData of data2) {
        //11.1 ส่งข้อมูลไปทีละ order เพื่อ Insert
        const addOrder = await axios.post(process.env.API_URL + `/zort/order/OrderManage/addOrderNew?token=${token}`, { dataOrder: addOrderData }, {});
        // console.log('scjkjjk:::'+addOrder.data)
        if (addOrder.data === 'lastnumber') {
          // ทำงานเมื่อ addOrder ทำงานสำเร็จ
          console.log('addOrder Success -- chechState')
          await logTable.create({ number: addOrderData.number, action: 'add Complete', createdAt: currentDate })

          //11.2 ส่งข้อมูลไปทีละ orderDetail เพื่อ Insert
          const addOrderDetail = await axios.post(process.env.API_URL + `/zort/order/OrderManage/addDeatail?token=${token}`, { dataOrder: addOrderData }, {});

          await logTable.update({ action1: `add detail complete ${addOrderData.id}` }, { where: { number: addOrderData.number } })

          //11.3 ส่งข้อมูลไปทีละออเดอ เพื่อ Insert
          const addCustomer = await axios.post(process.env.API_URL + `/zort/order/OrderManage/addCustomer?token=${token}`, { dataOrder: addOrderData }, {});

          await logTable.update({ action2: `add customer complete ${addOrderData.customercode} : cusid ${addOrderData.customerid}` }, { where: { number: addOrderData.number } })
          //11.4 เมื่อ Insert ทุกอย่างแล้ว จะทำการตัดสต็อก
          const cutStock = await axios.post(process.env.API_URL + `/zort/order/OrderManage/cusStock?token=${token}`, {}, {});

          await logTable.update({ action3: `cus Stock complete ${addOrderData.id}` }, { where: { number: addOrderData.number } })
          // console.log(addCustomer.data);
        } else {
          // ทำงานเมื่อ addOrder ทำงานไม่สำเร็จ
          // console.log('Error in addOrder:', addOrder.statusText)
          console.log('addOrder failed -- chechState')
          //  process.exit()
        }

      }

      // const updateStatusOrder = await  axios.post(process.env.API_URL+`/zort/order/OrderManage/updateStatusOrder?token=${token}`,{},{});
      res.json({ log: 'Add Complete', newOrder: data2.length })
    } else {
      res.json({ log: 'no orderNew' })
    }

    // res.json(filteredDataList)


  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }

});

addOrder.put('/updateOrderId', async (req, res) => {
  const headers = {
    storename: process.env.zortstorename,
    apikey: process.env.zortapikey,
    apisecret: process.env.zortapisecret,
  };
  try {

    // // const data = await Order.findAll({attributes:['number']})
    const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, { expiresIn: '2h' })
    // // for(let i = 0;i<data.length;i++){
    const response = await axios.get(process.env.zortapiopenurlOrder + '?Orderdateafter=2023-08-04&status=0,1,3', {
      // const response = await axios.get('https://open-api.zortout.com/v4/Order/GetOrderDetail?id=116364876', {
      headers: {
        storename: process.env.zortstorename,
        apikey: process.env.zortapikey,
        apisecret: process.env.zortapisecret,
        numberlist: `${req.body.number}`
      },
    });


    //        const addOrderData = response.data.list[0]
    //       const addOrderDetail = await  axios.post(process.env.API_URL+`/zort/order/OrderManage/addDeatail?token=${token}`,{dataOrder:addOrderData },{});

    // for(let i = 0 ; i<response.data.list.length;i++){
    //   const item = response.data.list[i]
    //   for(let i=0;i<item.length;i++){
    //     console.log(item.list[i]);
    //   }
    // console.log(addOrderData);
    // const addOrderData = response.data.list[0]
    // const addCustomer = await  axios.post(process.env.API_URL+`/zort/order/OrderManage/addCustomer?token=${token}`,{dataOrder:addOrderData},{});

    // await Order.update({customerid:response.data.list[i].customerid},{where:{number:response.data.list[i].number}})

    //   await Customer.findOrCreate({
    //     where: {
    //         customerid:response.data.list[i].customerid
    //     },
    //     defaults: {
    //       customerid:response.data.list[i].customerid,
    //       customername:response.data.list[i].customername,
    //       customercode:response.data.list[i].customercode,
    //       customeridnumber:response.data.list[i].customeridnumber,
    //       customeremail:response.data.list[i].customeremail,
    //       customerphone:response.data.list[i].customerphone,
    //       customeraddress:response.data.list[i].customeraddress,
    //       customerpostcode:response.data.list[i].customerpostcode,
    //       customerprovince:response.data.list[i].customerprovince,
    //       customerdistrict:response.data.list[i].customerdistrict,
    //       customersubdistrict:response.data.list[i].customersubdistrict,
    //       customerstreetAddress:response.data.list[i].customerstreetAddress,
    //       customerbranchname:response.data.list[i].customerbranchname,
    //       customerbranchno:response.data.list[i].customerbranchno,
    //       facebookname:response.data.list[i].facebookname,
    //       facebookid:response.data.list[i].facebookid,
    //       line:response.data.list[i].line,
    //       lineid:response.data.list[i].lineid,
    //     }
    // });


    // await Order.update({id:response.data.list[i].id},{where:{number:response.data.list[i].number}});
    // console.log(response.data.list[i].id+':'+response.data.list[i].number);
    // }

    // } 
    res.json(response)
    // res.json('written')
  } catch (error) {

  }
})

addOrder.post('/addOrderDetailFix', async (req, res) => {
  try {
    const { allIds } = req.body;

    // ✅ รวมทั้งหมดเป็น array พร้อมใช้งาน
    // const allIds = [
    //   256402334,
    //   256404570,
    //   256407744,
    //   256408522,
    //   256408813,
    //   256410241,
    //   256410925,
    //   256412193,
    //   256416453,
    //   256420341,
    //   256425584,
    //   256426982,
    //   256406273,
    //   256420671,
    //   256422758,
    //   256422946,
    //   256416123
    // ];

    console.log("Total IDs:", allIds.length);


    const chunk = (arr, size) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );

    const idChunks = chunk(allIds, 80); // ✅ แบ่งชุดละ 80 ตัว

    (async () => {
      for (const [i, ids] of idChunks.entries()) {
        console.log(`🚀 Sending batch ${i + 1}/${idChunks.length} (${ids.length} IDs)`);

        try {
          const response = await axios.get(process.env.zortapiopenurlOrder, {
            headers: {
              storename: process.env.zortstorename,
              apikey: process.env.zortapikey,
              apisecret: process.env.zortapisecret,
              orderidlist: ids.join(','),
            },
          });
          const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, { expiresIn: '2h' })

          for (const addOrderData of response.data.list) {
            await axios.post(
              `${process.env.API_URL}/zort/order/OrderManage/addDeatail?token=${token}`,
              { dataOrder: addOrderData }
            );
          }

          console.log(`✅ Batch ${i + 1} done`);
        } catch (err) {
          console.error(`❌ Error in batch ${i + 1}`, err.message);
        }
      }
    })();


    // const response = await axios.get(process.env.zortapiopenurlOrder, {
    //   // const response = await axios.get(process.env.zortapiopenurlOrder+'?Orderdateafter=2023-08-10', {
    //   headers: {
    //     storename: process.env.zortstorename,
    //     apikey: process.env.zortapikey,
    //     apisecret: process.env.zortapisecret,
    //     orderidlist: Array.isArray(id) ? id.join(',') : id,
    //   },
    // });

    // // ✅ ตรวจสอบว่ามีข้อมูลก่อนวนลูป
    // if (response.data?.list?.length) {
    //   for (const addOrderData of response.data.list) {
    //     await axios.post(
    //       `${process.env.API_URL}/zort/order/OrderManage/addDeatail?token=${token}`,
    //       { dataOrder: addOrderData }
    //     );
    //   }
    // }

    res.json({
      log: 'Add addOrderDetailFix',
      // newOrder: response.data?.list?.length || 0, // ✅ ป้องกัน undefined
    });

  } catch (error) {
    console.log("addOrderDetailFix", error)
    res.statusCode(500).json({
      error: error
    })
  }
})


module.exports = addOrder;    