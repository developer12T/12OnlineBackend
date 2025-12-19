const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { OrderHis, OrderDetailHis } = require('../model/Order');

async function InvReprint(res, dateFilter = {}) {
    try {
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

        const data = await OrderHis.findAll({
            attributes: ['updatedatetime', 'number', 'id', 'saleschannel', 'invno', 'cono'],
            where: whereClause,
            order: [
                ['updatedatetime', 'ASC'],
                ['invno', 'ASC']
            ]
        });

        const orders = [];

        for (let i = 0; i < data.length; i++) {
            const itemData = await OrderDetailHis.findAll({
                attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice'],
                where: { id: data[i].id }
            });

            const items = itemData.map(item => ({
                productid: item.productid,
                sku: item.sku.split('_')[0],
                unit: item.sku.split('_')[1],
                name: item.name,
                number: item.number,
                pricepernumber: item.pricepernumber,
                totalprice: item.totalprice
            }));

            // const order = {
            //     "updatedatetime": "2025-10-01",
            //     "number": "251001URJV47VK",
            //     "id": 252280280,
            //     "saleschannel": "Shopee",
            //     "invno": "2568171032222",
            //     "cono": 1257132227,
            //     item: items,

            // };
            const order = {
                updatedatetime: data[i].updatedatetime,
                number: data[i].number,
                id: data[i].id,
                saleschannel: data[i].saleschannel,
                invno: data[i].invno,
                cono: data[i].cono,
                item: items,

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