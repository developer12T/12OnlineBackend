const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { OrderHis, OrderDetailHis } = require('../model/Order');


const orderModel = require('../../model/order')
const customerModel = require('../../model/customer');
const { getModelsByChannel } = require('../../authen/middleware/channel')

async function InvReprint(res, channel, dateFilter = {}) {
    try {
        const { Order } = getModelsByChannel(channel, res, orderModel)
        let whereClause = {};

        // เพิ่มเงื่อนไขวันที่ถ้ามีการส่งเข้ามา
        if (dateFilter.startDate && dateFilter.endDate) {
            whereClause = {
                updatedatetime: {
                    [Op.gte]: dateFilter.startDate,
                    [Op.lte]: dateFilter.endDate
                }
            };
        }

        const data = await Order.find(
            whereClause,
            {
                updatedatetime: 1,
                number: 1,
                id: 1,
                saleschannel: 1,
                invno: 1,
                cono: 1,
                listProduct: 1 
            }
        )
            .sort({ updatedatetime: 1, invno: 1 })
            .lean();

        const orders = [];

        for (const row of data) {

            const items = (row.listProduct || []).map(item => {
                const [sku = '', unit = ''] = item.sku?.split('_') || [];

                return {
                    productid: item.productid,
                    sku,
                    unit,
                    name: item.name,
                    number: item.number,
                    pricepernumber: item.pricepernumber,
                    totalprice: item.totalprice
                };
            });

            const order = {
                updatedatetime: row.updatedatetime,
                number: row.number,
                id: row.id,
                saleschannel: row.saleschannel,
                invno: row.invno,
                cono: row.cono,
                item: items
            };

            orders.push(order);
        }



        return orders;
    } catch (error) {
        console.log(error);
        return { status: 'dataNotFound' };
    }
}

module.exports = InvReprint;