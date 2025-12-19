const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
// const { Order, OrderDetail } = require('../model/Order');
// const { Customer } = require('../model/Customer');
const axios = require('axios')

const orderModel = require('../../model/order')
const customerModel = require('../../model/customer');
const { getModelsByChannel } = require('../../authen/middleware/channel');


async function M3WaitTab(res,channel) {
    try {
        const { Order } = getModelsByChannel(channel, res, orderModel)
        const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getOrderErpToShow', {}, {});
        const listid = response.data

        const orders = [];

        const orderIdList = [... new Set(listid.number)]
        const datapre = await Order.find({
            number: { $in: orderIdList }
        });
        const data = datapre

        for (const orderData of dataOrder) {

        //     // console.log('test debug ::')
        //     // console.log(data.length);
        //     // console.log(Object.keys(data[0]));
        //     // console.log(data[0].value);
        //     // if (Array.isArray(data)) {
        //     //     console.log('Array length:', data.length);
        //     //     console.log('First item:', data[0]);
        //     //     console.log('Last item:', data[316]);
        //     // } else if (data?.recordset) {
        //     //     console.log('Recordset length:', data.recordset.length);
        //     //     console.log('First item:', data.recordset[0]);
        //     // } else if (Array.isArray(data[0])) {
        //     //     console.log('Nested array length:', data[0].length);
        //     //     console.log('First item:', data[0][0]);
        //     // } else {
        //     //     console.log('Unknown data format:', data);
        //     // }
        //     // console.log(data[0].value);
        //     const cusdata = await Customer.findAll({
        //         attributes: ['customername', 'customerid'],
        //         where: {
        //             customerid: data[i].customerid
        //         }
        //     })
        //     // console.log(cusdata)



            const cuss = orderData?.customername || '';

            if (orderData.status === 'Success') {
                var statusText = 'สำเร็จ'
            } else if (orderData.status === 'Voided') {
                var statusText = 'ยกเลิก'
            } else if (orderData.status === 'Waiting') {
                var statusText = 'รอส่ง'
            } else if (orderData.status === 'Pending') {
                var statusText = 'รอโอน'
            } else {
                var statusText = 'พบข้อผิดพลาด'
            }

            if (orderData.paymentstatus === 'Paid') {
                var paymentstatusText = 'ชำระแล้ว'
            } else if (orderData.paymentstatus === 'Voided') {
                var paymentstatusText = 'ยกเลิก'
            } else if (orderData.paymentstatus === 'Pending') {
                var paymentstatusText = 'รอชำระ'
            } else {
                var paymentstatusText = 'พบข้อผิดพลาด'
            }

            if (orderData.isCOD == '1') {
                var isCOD = 'เก็บปลายทาง'
            } else {
                var isCOD = 'ไม่เก็บปลายทาง'
            }



            const order = {
                id: orderData.id,
                cono: orderData.cono,
                invno: orderData.invno,
                orderdate: orderData.orderdate,
                orderdateString: orderData.orderdateString,
                number: orderData.number,
                customerid: orderData.customerid,
                status: orderData.status,
                statusText: statusText,
                paymentstatus: orderData.paymentstatus,
                paymentstatusText: paymentstatusText,
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