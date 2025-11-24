const express = require('express');
const DasboardView = express.Router();
const { sequelize } = require('../config/database')
const { Order, OrderHis } = require('../model/Order')
const { Op } = require('sequelize');
const { Customer } = require('../model/Customer')
const axios = require('axios')
const { Product } = require('../model/Product')
DasboardView.post('/getData', async (req, res) => {

    try {

        const orders = await OrderHis.findAll({ raw: true });
        const grouped = orders.reduce((acc, order) => {
            // parse string format dd/MM/yyyy
            const [year, month, day] = order.updatedatetime.split(' ')[0].split('-');
            const yearInt = parseInt(year, 10);

            if (!acc[yearInt]) {
                acc[yearInt] = {
                    yearOrder: yearInt,
                    countMakro: 0,
                    countShopee: 0,
                    countLazada: 0,
                    countAmaze: 0,
                    countTiktok: 0,
                };
            }

            if (order.saleschannel === 'Makro') acc[yearInt].countMakro++;
            if (order.saleschannel === 'Shopee') acc[yearInt].countShopee++;
            if (order.saleschannel === 'Lazada') acc[yearInt].countLazada++;
            if (order.saleschannel === 'Amaze') acc[yearInt].countAmaze++;
            if (order.saleschannel === 'TIKTOK') acc[yearInt].countTiktok++;

            return acc;
        }, {});
        const result = Object.values(grouped).sort((a, b) => a.yearOrder - b.yearOrder);
        console.log(result);

        const countOrderAll = await Order.count({ where: { status: { [Op.not]: 'Voided' } } });

        const countOrderShopee = await Order.count({ where: { saleschannel: 'Shopee', status: { [Op.not]: 'Voided' } } });
        const countOrderLazada = await Order.count({ where: { saleschannel: 'Lazada', status: { [Op.not]: 'Voided' } } });

        const countOrderWaitPrint = await Order.count({
            where: {
                statusprint: '000',
                statusPrininvSuccess: '000',
                status: { [Op.not]: 'Voided' }
            }
        });

        const StockZort = await Product.count();

        const StockZortout = await Product.count({ where: { stock: 0 } });

        var StockM3 = await axios.post('http://192.168.2.97:8383/M3API/StockManage/Stock/getStockCount');
        var countStockM3 = (StockM3.data[0].stockerp);

        var inv = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getInvNumber', { ordertype: '071' }, {});
        var invM3 = (inv.data[0].customerordno);

        var cono = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries', {
            series: "ง",
            seriestype: "01",
            companycode: 410,
            seriesname: "0"
        }, {});
        var conoM3 = (cono.data[0].lastno);

        var OSPE = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/order/getCustomerInv', {
            customertype: "107",
            customercode: "OSPE",
        }, {});
        var OSPENO = (OSPE.data[0].customercode);

        var OLAZ = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/order/getCustomerInv', {
            customertype: "107",
            customercode: "OLAZ",
        }, {});
        var OLAZNO = (OLAZ.data[0].customercode);

        var invZort = await Order.findAll({
            attributes: ['invno'],
            order: [['invno', 'DESC']],
            limit: 1
        })
        const topInvno = invZort[0].invno;

        const invzort = parseInt(invZort[0].invno);
        const invm3c = parseInt(invZort[0].invM3);


        if (invm3c > invzort) {
            var lastInvThrust = invM3
        } else {
            var lastInvThrust = topInvno
        }




        res.json([{
            'CountByYear': result,
            'CountOrderAll': countOrderAll,
            'OrderCountShopee': countOrderShopee,
            'OrderCountLazada': countOrderLazada,
            'CountOrderWaitPrint': countOrderWaitPrint,
            'CountOrderSuccessPrint': countOrderAll - countOrderWaitPrint,
            'StockZort': StockZort,
            'WarStock': StockZortout,
            'StockM3': countStockM3,
            'InvLastno': lastInvThrust,
            'conoLastno': conoM3,
            'cuscodeOspeLastno': OSPENO,
            'cuscodeOlazLastno': OLAZNO,


        }])
    } catch (error) {
        console.log(error);
        res.json("invalid req")
    }
})

module.exports = DasboardView;  