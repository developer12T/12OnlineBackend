const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { Order,OrderDetail } = require('../model/Order');
const { Customer } = require('../model/Customer');

async function invSuccessTab(res) {
    const data = await Order.findAll({
        where: {
            statusprintINV: 'TaxInvoice',
            [Op.or]: [
                {   statusPrininvSuccess: '001' },
                {   statusPrininvSuccess: '002' },
            ]
          
        }
    });
    const orders = [];

    for (let i = 0; i < data.length; i++) {
        const itemData = await OrderDetail.findAll({
            attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice'],
            where: {
                id: data[i].id
            }
        });

        const cusdata = await Customer.findAll({
            attributes: ['customername'],
            where: {
                customerid: data[i].customerid
            }
        })

        // const cuss = cusdata.customername;
        const cuss = cusdata[0]?.customername || '';
        // console.log(itemData);

        // console.log(cuss)
        // var itskulist = listofdetail.sku.split('_')[1] ;
        const items = itemData.map(item => ({
            productid: item.productid,
            sku: item.sku.split('_')[0],
            unit: item.sku.split('_')[1],
            name: item.name,
            number: item.number,
            pricepernumber: item.pricepernumber,
            totalprice: item.totalprice
        }));

        const order = {
            id: data[i].id,
            // saleschannel: data[i].saleschannel,
            orderdate: data[i].orderdate,
            orderdateString: data[i].orderdateString,
            number: data[i].number,
            customerid: data[i].customerid,
            status: data[i].status,
            paymentstatus: data[i].paymentstatus,
            amount: data[i].amount,
            vatamount: data[i].vatamount,
            shippingchannel: data[i].shippingchannel,
            shippingamount: data[i].shippingamount,
            shippingstreetAddress: data[i].shippingstreetAddress,
            shippingsubdistrict: data[i].shippingsubdistrict,
            shippingdistrict: data[i].shippingdistrict,
            shippingprovince: data[i].shippingprovince,
            shippingpostcode: data[i].shippingpostcode,
            createdatetime:data[i].createdatetime,
            statusprint: data[i].statusprint,
            totalprint:data[i].totalprint,
            saleschannel: data[i].saleschannel,
            item: items,
            customer: cuss,
        };
        orders.push(order);
    }
   
    return orders;
  }
  
  module.exports = invSuccessTab;