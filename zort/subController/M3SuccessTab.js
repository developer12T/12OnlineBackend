const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
// const { OrderHis, OrderDetailHis } = require('../model/Order');
// const { Customer } = require('../model/Customer');
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer');
const { getModelsByChannel } = require('../../authen/middleware/channel');
const order = require('../../model/order');
// async function M3SuccessTab(res) {
//     try {


// const threeMonthsAgo = new Date();
// threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

//         const data = await OrderHis.findAll({
//             where: {
//                 updatedatetime: {
//                   [Op.gte]: threeMonthsAgo
//                 }
//               },
//               order: [['updatedatetime', 'DESC']],
//         });
//         const orders = [];

//         for (let i = 0; i < data.length; i++) {
//             const itemData = await OrderDetailHis.findAll({
//                 attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice'],
//                 where: {
//                     id: data[i].id
//                 }
//             });

//             const cusdata = await Customer.findAll({
//                 attributes: ['customername','customerid'],
//                 where: {
//                     customerid: data[i].customerid
//                 }
//             })



//             const cuss = cusdata[0]?.customername || '';



//             const items = itemData.map(item => ({
//                 productid: item.productid,
//                 sku: item.sku.split('_')[0],
//                 unit: item.sku.split('_')[1],
//                 name: item.name,
//                 number: item.number,
//                 pricepernumber: item.pricepernumber,
//                 totalprice: item.totalprice
//             }));


//             if(data[i].status === 'Success'){
//                 var statusText = 'สำเร็จ'
//             }else if(data[i].status === 'Voided'){
//                 var statusText = 'ยกเลิก'
//             }else if(data[i].status === 'Waiting'){
//                 var statusText = 'รอส่ง'
//             }else if(data[i].status === 'Pending'){
//                 var statusText = 'รอโอน'
//             }else{
//                 var statusText = 'พบข้อผิดพลาด'
//             }

//             if(data[i].paymentstatus === 'Paid'){
//                 var paymentstatusText = 'ชำระแล้ว'
//             }else if(data[i].paymentstatus === 'Voided'){
//                 var paymentstatusText = 'ยกเลิก'
//             }else if(data[i].paymentstatus === 'Pending'){
//                 var paymentstatusText = 'รอชำระ'
//             }else{
//                 var paymentstatusText = 'พบข้อผิดพลาด'
//             }

//             if(data[i].isCOD == '1'){
//                 var isCOD = 'เก็บปลายทาง'
//             }else{
//                 var isCOD = 'ไม่เก็บปลายทาง'
//             }


//             const order = {
//                 id: data[i].id,

//                 cono:data[i].cono,
//                 invno:data[i].invno,
//                 orderdate: data[i].orderdate,
//                 orderdateString: data[i].orderdateString,
//                 number: data[i].number,
//                 customerid: data[i].customerid,
//                 status: data[i].status,
//                 statusText:statusText,
//                 paymentstatus: data[i].paymentstatus,
//                 paymentstatusText:paymentstatusText,
//                 amount: data[i].amount,
//                 vatamount: data[i].vatamount,
//                 shippingchannel: data[i].shippingchannel,
//                 shippingamount: data[i].shippingamount,
//                 shippingstreetAddress: data[i].shippingstreetAddress,
//                 shippingsubdistrict: data[i].shippingsubdistrict,
//                 shippingdistrict: data[i].shippingdistrict,
//                 shippingprovince: data[i].shippingprovince,
//                 shippingpostcode: data[i].shippingpostcode,
//                 createdatetime:data[i].createdatetime,
//                 statusprint: data[i].statusprint,
//                 totalprint:data[i].totalprint,
//                 saleschannel: data[i].saleschannel,
//                 item: items,
//                 customer: cuss,
//                 isCOD:isCOD
//             };
//             orders.push(order);
//         }

//         return orders;
//     } catch (error) {
//       return  { status: 'dataNotFound' };
//     }
//   }

async function M3SuccessTab(res, channel) {
    try {
        const { Order } = getModelsByChannel(channel, res, orderModel)

        // 📅 ปัจจุบัน - 3 เดือน
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        // 🔎 ดึง order + customer ทีเดียว
        const dataOrder = await Order.find({
            updatedAt: { $gte: threeMonthsAgo }
        }).sort({ updatedAt: -1 })

        const statusMapping = {
            Success: 'สำเร็จ',
            Voided: 'ยกเลิก',
            Waiting: 'รอส่ง',
            Pending: 'รอโอน',
            SHIPPING: 'ส่งสำเร็จ'
        }

        const paymentStatusMapping = {
            Paid: 'ชำระแล้ว',
            paid: 'ชำระแล้ว',
            Voided: 'ยกเลิก',
            Pending: 'รอชำระ'
        }

        const orders = [];

        for (const orderData of dataOrder) {

            const items = [];
            for (const item of orderData.listProduct || []) {
                items.push({
                    productid: item.productid,
                    sku: item.sku?.split('_')?.[0] || '',
                    unit: item.sku?.split('_')?.[1] || '',
                    name: item.name,
                    number: item.number,
                    pricepernumber: item.pricepernumber,
                    totalprice: item.totalprice
                });
            }

            orders.push({
                id: orderData.id,
                cono: orderData.cono,
                invno: orderData.invno,
                updatedatetime: orderData.updatedAt,
                orderdate: orderData.orderdate,
                orderdateString: orderData.orderdateString,
                number: orderData.number,
                customerid: orderData.customerid,
                status: orderData.status,
                statusText: statusMapping[orderData.status] || 'พบข้อผิดพลาด',
                paymentstatus: orderData.paymentstatus,
                paymentstatusText:
                    paymentStatusMapping[orderData.paymentstatus] || 'พบข้อผิดพลาด',
                amount: orderData.amount,
                vatamount: orderData.vatamount,
                shippingchannel: orderData.shippingchannel,
                shippingamount: orderData.shippingamount,
                shippingstreetAddress: orderData.shippingstreetAddress,
                shippingsubdistrict: orderData.shippingsubdistrict,
                shippingdistrict: orderData.shippingdistrict,
                shippingprovince: orderData.shippingprovince,
                shippingpostcode: orderData.shippingpostcode,
                createdatetime: orderData.createdAt,
                statusprint: orderData.statusprint,
                totalprint: orderData.totalprint ?? 0,
                saleschannel: orderData.saleschannel,
                item: items,
                customer: orderData.customername || '',
                isCOD: orderData.isCOD === '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง'
            });
        }

        return orders
    } catch (err) {
        console.error(err)
        throw err
    }
}

module.exports = M3SuccessTab;