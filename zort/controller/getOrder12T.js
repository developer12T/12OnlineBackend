const express = require('express');
const getOrder12T = express.Router();
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const receiptWaitTab = require('../subController/ReceiptWaitTab');
const receiptSuccessTab = require('../subController/ReceiptSuccessTab');
const AllOrderTab = require('../subController/AllOrderTab');
const invtWaitTab = require('../subController/InvWaitTab');
const invSuccessTab = require('../subController/InvSuccessTab');
const M3WaitTab = require('../subController/M3WaitTab');
const M3SuccessTab = require('../subController/M3SuccessTab');
const ReceiptWaitTabPayment = require('../subController/ReceiptWaitTabPayment');
const InvReprint = require('../subController/InvReprint');
const { Order, OrderHis, OrderDetailHis } = require('../model/Order');
const { Customer } = require('../model/Customer');

getOrder12T.post('/getOrder', async (req, res) => {
    var page = req.body.page;
    var tab = req.body.tab;
    try {
        if (page == 'receipt') {
            if (tab == 'wait-tab') {
                receiptWaitTab(res).then(orders => { res.json(orders); })
            } else if (tab == 'success-tab') {
                receiptSuccessTab(res).then(orders => { res.json(orders); })
            } else if (tab == 'payment-tab') {
                ReceiptWaitTabPayment(res).then(orders => { res.json(orders) })
            }
        } else if (page == 'all') {
            AllOrderTab(res).then(orders => { res.json(orders); })
            // const data = await Order.findAll()
            // res.json(data)
        } else if (page == 'inv') {
            if (tab == 'wait-tab') {
                invtWaitTab(res).then(orders => { res.json(orders); })
            } else if (tab == 'success-tab') {
                invSuccessTab(res).then(orders => { res.json(orders); })
            }
        } else if (page == 'preparem3') {
            if (tab == 'wait-tab') {
                M3WaitTab(res).then(orders => { res.json(orders); })
            } else if (tab == 'success-tab') {
                M3SuccessTab(res).then(orders => { res.json(orders); })
            }
        }else if (page == 'reprint') {
            // รับพารามิเตอร์วันที่จาก request body
            const { startDate, endDate } = req.body;
            const dateFilter = { startDate, endDate };
            
            InvReprint(res, dateFilter).then(orders => { res.json(orders); })
        }
    } catch (error) {
        res.status(500).json('invalid data')
        console.log(error);
    }

});

getOrder12T.post('/getOrderHistory', async (req, res) => {
    try {
        const currentDate = new Date();
        const defaultMonth = currentDate.getMonth() + 1;
        const defaultYear = currentDate.getFullYear();

        const { month = defaultMonth, year = defaultYear, page = 1, limit = 200, search } = req.body;

        if (isNaN(month) || isNaN(year) || isNaN(page) || isNaN(limit)) {
            return res.status(400).json('Invalid input format.');
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const offset = (page - 1) * limit;

        let whereClause = {
            updatedatetime: {
                [Op.gte]: startDate,
                [Op.lte]: endDate,
            },
        };

        if (search) {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    { cono: { [Op.like]: `%${search}%` } },
                    { invno: { [Op.like]: `%${search}%` } },
                    { number: { [Op.like]: `%${search}%` } },
                    { orderdateString: { [Op.like]: `${search}%` } },
                ],
            };
        }

        const { count, rows: data } = await OrderHis.findAndCountAll({
            attributes: ['id', 'cono', 'invno', 'createdatetime', 'orderdateString', 'updatedatetime', 'number', 'customerid', 'status', 'paymentstatus', 'amount', 'vatamount', 'shippingchannel', 'shippingamount', 'shippingstreetAddress', 'shippingsubdistrict', 'shippingdistrict', 'shippingprovince', 'shippingpostcode', 'statusprint', 'totalprint', 'saleschannel', 'isCOD'],
            where: whereClause,
            offset,
            limit,
        });

        const orders = await Promise.all(data.map(async (order) => {
            const [itemData, cusdata] = await Promise.all([
                OrderDetailHis.findAll({
                    attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice'],
                    where: {
                        id: order.id,
                    },
                }),
                Customer.findOne({
                    attributes: ['customername'],
                    where: {
                        customerid: order.customerid,
                    },
                }),
            ]);

            const cuss = cusdata?.customername || '';

            const items = itemData.map((item) => ({
                productid: item.productid,
                sku: item.sku.split('_')[0],
                unit: item.sku.split('_')[1],
                name: item.name,
                number: item.number,
                pricepernumber: item.pricepernumber,
                totalprice: item.totalprice,
            }));

            let statusText, paymentstatusText, isCOD;

            switch (order.status) {
                case 'Success':
                    statusText = 'สำเร็จ';
                    break;
                case 'Voided':
                    statusText = 'ยกเลิก';
                    break;
                case 'Waiting':
                    statusText = 'รอส่ง';
                    break;
                case 'Pending':
                    statusText = 'รอโอน';
                    break;
                default:
                    statusText = 'พบข้อผิดพลาด';
            }

            switch (order.paymentstatus) {
                case 'Paid':
                    paymentstatusText = 'ชำระแล้ว';
                    break;
                case 'Voided':
                    paymentstatusText = 'ยกเลิก';
                    break;
                case 'Pending':
                    paymentstatusText = 'รอชำระ';
                    break;
                default:
                    paymentstatusText = 'พบข้อผิดพลาด';
            }

            isCOD = order.isCOD === '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง';

            return {
                id: order.id,
                cono: order.cono,
                invno: order.invno,
                orderdate: order.orderdateString,
                printdate: order.updatedatetime,
                number: order.number,
                customerid: order.customerid,
                status: order.status,
                statusText,
                paymentstatus: order.paymentstatus,
                paymentstatusText,
                amount: order.amount,
                vatamount: order.vatamount,
                shippingchannel: order.shippingchannel,
                shippingamount: order.shippingamount,
                shippingstreetAddress: order.shippingstreetAddress,
                shippingsubdistrict: order.shippingsubdistrict,
                shippingdistrict: order.shippingdistrict,
                shippingprovince: order.shippingprovince,
                shippingpostcode: order.shippingpostcode,
                statusprint: order.statusprint,
                totalprint: order.totalprint,
                saleschannel: order.saleschannel,
                item: items,
                customer: cuss,
                isCOD,
            };
        }));

        res.json({
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            orders,
        });
    } catch (error) {
        res.status(500).json('Invalid data');
        console.log(error);
    }
});


function getMonthText(month) {
    switch (month) {
        case 1:
            return 'มกราคม';
        case 2:
            return 'กุมภาพันธ์';
        case 3:
            return 'มีนาคม';
        case 4:
            return 'เมษายน';
        case 5:
            return 'พฤษภาคม';
        case 6:
            return 'มิถุนายน';
        case 7:
            return 'กรกฎาคม';
        case 8:
            return 'สิงหาคม';
        case 9:
            return 'กันยายน';
        case 10:
            return 'ตุลาคม';
        case 11:
            return 'พฤศจิกายน';
        case 12:
            return 'ธันวาคม';
        default:
            return 'ไม่ทราบ';
    }
}

getOrder12T.post('/getOrderOptions', async (req, res) => {
    try {
        const groupedData = await OrderHis.findAll({
            attributes: [
                [Sequelize.literal('YEAR(updatedatetime)'), 'year'],
                [Sequelize.literal('MONTH(updatedatetime)'), 'month'],
            ],
            group: [Sequelize.literal('YEAR(updatedatetime)'), Sequelize.literal('MONTH(updatedatetime)')],
            order: [
                [Sequelize.literal('YEAR(updatedatetime)'), 'ASC'],
                [Sequelize.literal('MONTH(updatedatetime)'), 'ASC']
            ],
            raw: true,
        });

        const yearMonthMap = {};

        groupedData.forEach(data => {
            const year = data.year.toString();
            const month = data.month.toString().padStart(2, '0');
            const monthText = getMonthText(data.month);

            if (!yearMonthMap[year]) {
                yearMonthMap[year] = [];
            }

            yearMonthMap[year].push({ num: month, text: monthText });
        });

        const result = Object.keys(yearMonthMap).map(year => ({
            year,
            month: yearMonthMap[year]
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = getOrder12T;