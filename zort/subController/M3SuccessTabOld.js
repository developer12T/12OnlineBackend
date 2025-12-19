const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { OrderHis,OrderDetailHis } = require('../model/Order');
const { Customer } = require('../model/Customer');

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
  
async function M3SuccessTab(res) {
    try {
        // วันที่ปัจจุบัน ลบ 3 เดือน
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // ใช้ JOIN แทนการ loop query
        const data = await OrderHis.findAll({
            include: [
                {
                    model: OrderDetailHis,
                    attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice'],
                    required: false
                },
                {
                    model: Customer,
                    attributes: ['customername', 'customerid'],
                    required: false
                }
            ],
            where: {
                updatedatetime: {
                    [Op.gte]: threeMonthsAgo
                }
            },
            order: [['updatedatetime', 'DESC']],
            limit: 5000, // จำกัดข้อมูลต่อครั้ง
            raw: false, // สำคัญ: ต้องเป็น false เพื่อให้ include ทำงาน
            subQuery: false, // ป้องกัน subquery ที่ช้า
            logging: console.log // ดู SQL query ที่สร้าง
        });

        // สร้าง lookup object สำหรับ status mapping
        const statusMapping = {
            'Success': 'สำเร็จ',
            'Voided': 'ยกเลิก',
            'Waiting': 'รอส่ง',
            'Pending': 'รอโอน',
            'SHIPPING':'ส่งสำเร็จ'
        };

        const paymentStatusMapping = {
            'Paid': 'ชำระแล้ว',
            'Voided': 'ยกเลิก',
            'Pending': 'รอชำระ',
            'paid':'ชำระแล้ว'
        };

        // Map ข้อมูลแบบ functional programming
        const orders = data.map(orderData => {
            // Process items
            const items = (orderData.OrderDetailHis || []).map(item => ({
                productid: item.productid,
                sku: item.sku.split('_')[0],
                unit: item.sku.split('_')[1],
                name: item.name,
                number: item.number,
                pricepernumber: item.pricepernumber,
                totalprice: item.totalprice
            }));

            return {
                id: orderData.id,
                cono: orderData.cono,
                invno: orderData.invno,
                updatedatetime:orderData.updatedatetime,
                orderdate: orderData.orderdate,
                orderdateString: orderData.orderdateString,
                number: orderData.number,
                customerid: orderData.customerid,
                status: orderData.status,
                statusText: statusMapping[orderData.status] || 'พบข้อผิดพลาด',
                paymentstatus: orderData.paymentstatus,
                paymentstatusText: paymentStatusMapping[orderData.paymentstatus] || 'พบข้อผิดพลาด',
                amount: orderData.amount,
                vatamount: orderData.vatamount,
                shippingchannel: orderData.shippingchannel,
                shippingamount: orderData.shippingamount,
                shippingstreetAddress: orderData.shippingstreetAddress,
                shippingsubdistrict: orderData.shippingsubdistrict,
                shippingdistrict: orderData.shippingdistrict,
                shippingprovince: orderData.shippingprovince,
                shippingpostcode: orderData.shippingpostcode,
                createdatetime: orderData.createdatetime,
                statusprint: orderData.statusprint,
                totalprint: orderData.totalprint,
                saleschannel: orderData.saleschannel,
                item: items,
                customer: orderData.Customer?.customername || '',
                isCOD: orderData.isCOD === '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง'
            };
        });

        return orders;
    } catch (error) {
        console.error('M3SuccessTab Error:', error);
        return { status: 'dataNotFound' };
    }
}

  module.exports = M3SuccessTab;