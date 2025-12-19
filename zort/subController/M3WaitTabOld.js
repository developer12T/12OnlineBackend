const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../model/Order');
const { Customer } = require('../model/Customer');
const axios = require('axios')
async function M3WaitTab(res) {
    try {

        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getOrderErpToShow', {}, {});
        const listid = response.data
        const datapre = []
        const orders = [];
        // console.log('data response', response)
        // for (let i = 0; i < listid.length; i++) {
        //     // console.log(listid[i].number);
        //     //   const dataindex = await Order.findOne({
        //     const dataindex = await Order.findAll({
        //         where: {
        //             number: listid[i].number
        //         }
        //     });
        //     //    console.log(dataindex[0]);                                   
        //     datapre.push(dataindex[0])
        // }

        // Fix
        for (let i = 0; i < listid.length; i++) {
            const dataindex = await Order.findAll({
              where: { number: listid[i].number }
            });
          
            if (dataindex.length > 0) {
              datapre.push(dataindex[0]);
            } else {
              console.log(`⚠️ Order not found for number: ${listid[i].number}`);
            }
          }
        // console.log('data Order',datapre)
        const data = datapre

        for (let i = 0; i < data.length; i++) {

            // console.log('test debug ::')
            // console.log(data.length);
            // console.log(Object.keys(data[0]));
            // console.log(data[0].value);
            // if (Array.isArray(data)) {
            //     console.log('Array length:', data.length);
            //     console.log('First item:', data[0]);
            //     console.log('Last item:', data[316]);
            // } else if (data?.recordset) {
            //     console.log('Recordset length:', data.recordset.length);
            //     console.log('First item:', data.recordset[0]);
            // } else if (Array.isArray(data[0])) {
            //     console.log('Nested array length:', data[0].length);
            //     console.log('First item:', data[0][0]);
            // } else {
            //     console.log('Unknown data format:', data);
            // }
            // console.log(data[0].value);
            const cusdata = await Customer.findAll({
                attributes: ['customername', 'customerid'],
                where: {
                    customerid: data[i].customerid
                }
            })
            // console.log(cusdata)



            const cuss = cusdata[0]?.customername || '';

            if (data[i].status === 'Success') {
                var statusText = 'สำเร็จ'
            } else if (data[i].status === 'Voided') {
                var statusText = 'ยกเลิก'
            } else if (data[i].status === 'Waiting') {
                var statusText = 'รอส่ง'
            } else if (data[i].status === 'Pending') {
                var statusText = 'รอโอน'
            } else {
                var statusText = 'พบข้อผิดพลาด'
            }

            if (data[i].paymentstatus === 'Paid') {
                var paymentstatusText = 'ชำระแล้ว'
            } else if (data[i].paymentstatus === 'Voided') {
                var paymentstatusText = 'ยกเลิก'
            } else if (data[i].paymentstatus === 'Pending') {
                var paymentstatusText = 'รอชำระ'
            } else {
                var paymentstatusText = 'พบข้อผิดพลาด'
            }

            if (data[i].isCOD == '1') {
                var isCOD = 'เก็บปลายทาง'
            } else {
                var isCOD = 'ไม่เก็บปลายทาง'
            }



            const order = {
                id: data[i].id,
                cono: data[i].cono,
                invno: data[i].invno,
                orderdate: data[i].orderdate,
                orderdateString: data[i].orderdateString,
                number: data[i].number,
                customerid: data[i].customerid,
                status: data[i].status,
                statusText: statusText,
                paymentstatus: data[i].paymentstatus,
                paymentstatusText: paymentstatusText,
                amount: data[i].amount,
                vatamount: data[i].vatamount,
                shippingchannel: data[i].shippingchannel,
                shippingamount: data[i].shippingamount,
                shippingstreetAddress: data[i].shippingstreetAddress,
                shippingsubdistrict: data[i].shippingsubdistrict,
                shippingdistrict: data[i].shippingdistrict,
                shippingprovince: data[i].shippingprovince,
                shippingpostcode: data[i].shippingpostcode,
                createdatetime: data[i].createdatetime,
                statusprint: data[i].statusprint,
                totalprint: data[i].totalprint,
                saleschannel: data[i].saleschannel,
                customer: cuss,
                isCOD: isCOD
            };
            orders.push(order);
        }

        return orders;
    } catch (error) {
        console.log(error);
        return { status: 'dataNotFound' };
    }
}

module.exports = M3WaitTab;