const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
// const { Order,OrderDetail } = require('../model/Order');
// const { Customer } = require('../model/Customer');
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer');
// const { Order } = require('../model/Order');
const { getModelsByChannel } = require('../../authen/middleware/channel')

async function invtWaitTab(res,channel) {

    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    const data = await Order.find({ statusprintinv: 'TaxInvoice', statusPrininvSuccess: '000' })


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

        const order = {
            id: row.id,
            // saleschannel: data[i].saleschannel,
            orderdate: row.orderdate,
            orderdateString: row.orderdateString,
            number: row.number,
            customerid: row.customerid,
            status: row.status,
            paymentstatus: row.paymentstatus,
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
            totalprint: row.totalprint,
            saleschannel: row.saleschannel,
            item: items,
            customer: cuss,
        };
        orders.push(order);
    }

    return orders;
}

module.exports = invtWaitTab;