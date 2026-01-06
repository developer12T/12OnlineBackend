const express = require('express');
// const getOrder = express.Router();
const { getModelsByChannel } = require('../../authen/middleware/channel')
const { Op } = require('sequelize');
// const { Order, OrderDetail } = require('../model/Order');
// const { Customer } = require('../model/Customer');
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer')



async function AllOrderTab(res, channel) {
    try {

        const { Order } = getModelsByChannel(channel, res, orderModel)
        const { Customer } = getModelsByChannel(channel, res, customerModel)

        const data = await Order.find({
            statusprint: '000',
            status: { $ne: 'Voided' }
        });

        const orders = [];

        for (const row of data) {

            const itemData = data.find(item => item.id === row.id)

            // console.log("itemData", itemData)

            const cusdata = await Customer.findOne(
                { customerid: row.customerid },

            ).select("customername customerid")
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
            const taxInStatus = row.statusprintinv === 'TaxInvoice' ? 'ขอใบกำกับภาษี' : '';
            const statusText = {
                'Success': 'สำเร็จ',
                'Voided': 'ยกเลิก',
                'Waiting': 'รอส่ง',
                'Pending': 'รอโอน'
            }[row.status] || 'พบข้อผิดพลาด';

            const paymentstatusText = {
                'Paid': 'ชำระแล้ว',
                'Voided': 'ยกเลิก',
                'Pending': 'รอชำระ'
            }[row.paymentstatus] || 'พบข้อผิดพลาด';

            const isCOD = row.isCOD == '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง';

            const order = {
                id: row.id,
                // saleschannel: data[i].saleschannel,
                cono: row.cono,
                invno: row.invno,
                orderdate: row.orderdate,
                orderdateString: row.orderdateString,
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
                totalprint: 0,
                saleschannel: row.saleschannel,
                item: items,
                customer: cuss,
                isCOD: isCOD
            };
            orders.push(order);

        }

        return orders;
    } catch (error) {
        console.log(error)
        return { status: 'dataNotFound' };
    }

}

module.exports = AllOrderTab;