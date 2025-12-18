const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../model/Order');
const { Customer } = require('../model/Customer');
const { getModelsByChannel } = require('../../authen/middleware/channel')
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer')



async function receiptSuccessTab(res, channel) {
    try {

        const { Order } = getModelsByChannel(channel, res, orderModel)
        const { Customer } = getModelsByChannel(channel, res, customerModel)


        const data = await Order.find({
            $or: [
                { statusprint: '001' },
                { statusprint: '002' },
                { statusPrininvSuccess: '001' },
                { statusPrininvSuccess: '002' }
            ]
        })
        const orders = [];

        for (const row of data) {

            const itemData = data.find(item => item.id === row.id)

            // console.log("itemData", itemData)


            const cusdata = await Customer.findOne({ customerid: row.customerid }).select("customername customerid")

            const cuss = cusdata?.customername || '';


            const items = itemData.listProduct.map(item => ({
                productid: item.productid,
                sku: item.sku.split('_')[0],
                unit: item.sku.split('_')[1],
                name: item.name,
                number: item.number,
                pricepernumber: item.pricepernumber,
                totalprice: item.totalprice
            }));


            if (row.totalprint == null) {
                var totalprint = 0
            } else {
                var totalprint = row.totalprint
            }

            if (row.statusprintinv === 'TaxInvoice') {
                var taxInStatus = 'ขอใบกำกับภาษี'

            } else {
                var taxInStatus = ''
            }
            if (row.status === 'Success') {
                var statusText = 'สำเร็จ'
            } else if (row.status === 'Voided') {
                var statusText = 'ยกเลิก'
            } else if (row.status === 'Waiting') {
                var statusText = 'รอส่ง'
            } else if (row.status === 'Pending') {
                var statusText = 'รอโอน'
            } else {
                var statusText = 'พบข้อผิดพลาด'
            }

            if (row.paymentstatus === 'Paid') {
                var paymentstatusText = 'ชำระแล้ว'
            } else if (row.paymentstatus === 'Voided') {
                var paymentstatusText = 'ยกเลิก'
            } else if (row.paymentstatus === 'Pending') {
                var paymentstatusText = 'รอชำระ'
            } else {
                var paymentstatusText = 'พบข้อผิดพลาด'
            }

            if (row.isCOD == '1') {
                var isCOD = 'เก็บปลายทาง'
            } else {
                var isCOD = 'ไม่เก็บปลายทาง'
            }

            const order = {
                id: row.id,
                // saleschannel: data[i].saleschannel,
                cono: row.cono,
                invno: row.invno,
                orderdate: row.orderdate,
                orderdateString: row.orderdateString,
                printdate: row.updatedatetime,
                printdatetime: row.updatedatetimeString,
                number: row.number,
                customerid: row.customerid,
                status: row.status,
                statusText: statusText,
                paymentstatus: row.paymentstatus,
                paymentstatusText: paymentstatusText,
                amount: row.amount,
                vatamount: row.vatamount,
                shippingchannel: row.shippingchannel,
                shippingamount: row.shippingamount,
                shippingstreetAddress: row.shippingstreetAddress,
                shippingsubdistrict: row.shippingsubdistrict,
                shippingdistrict: row.shippingdistrict,
                shippingprovince: row.shippingprovince,
                shippingpostcode: row.shippingpostcode,
                createdatetime: row.createdatetime,
                statusprint: row.statusprint,
                statusprintinv: row.statusprintinv,
                invstatus: taxInStatus,
                totalprint: totalprint,
                saleschannel: row.saleschannel,
                item: items,
                customer: cuss,
                isCOD: isCOD
            };
            orders.push(order);
        }
        orders.sort((a, b) => b.invno.localeCompare(a.invno))
        return orders;
    } catch (error) {
        console.log(error);
        return { status: 'dataNotFound' };
    }
}

module.exports = receiptSuccessTab;