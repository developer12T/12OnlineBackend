const express = require('express');
const getOrder = express.Router();
const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../model/Order');
const { Customer } = require('../model/Customer');
const moment = require('moment');
require('moment/locale/th');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
// function today() {
const currentDateTime = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
// }

async function receiptWaitTab(res) {
    try {
        const data = await Order.findAll({
            where: {
                statusprint: '000',
                statusPrininvSuccess: '000',
                status: {
                    [Op.not]: 'Voided'
                },
                [Op.or]: [
                    { paymentstatus: 'PAY_ON_ACCEPTANCE' },
                    { paymentstatus: 'Paid' }
                ]
            }
        });

        const orders = [];

        for (let i = 0; i < data.length; i++) {
            const itemData = await OrderDetail.findAll({
                attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice'],
                where: { id: data[i].id }
            });

         let cusdata
          if((data[i].customeriderp === 'OLAZ000000' && data[i].saleschannel === 'Lazada') || data[i].customeriderp === 'OAMZ000000' && data[i].saleschannel === 'Amaze'){
             cusdata = await Customer.findAll({
                attributes: ['customername', 'customerid', 'customeriderp', 'customercode'],
                // where: {
                //     [Op.or]: [
                //         { customerid: data[i].saleschannel === "Makro" ? null : data[i].customerid },
                //         { customeriderp: data[i].saleschannel === "Makro" ? data[i].customerid : null }
                //     ]
                // }
                where: {
                    // customercode: data[i].customeriderp 
                    customerid: data[i].customerid
                }
            });
          }else{
             cusdata = await Customer.findAll({
                attributes: ['customername', 'customerid', 'customeriderp', 'customercode'],
                // where: {
                //     [Op.or]: [
                //         { customerid: data[i].saleschannel === "Makro" ? null : data[i].customerid },
                //         { customeriderp: data[i].saleschannel === "Makro" ? data[i].customerid : null }
                //     ]
                // }
                where: {
                    customercode: data[i].customeriderp 
                }
            });
          }
           
            const cuss = cusdata[0]?.customername || '';
            // console.log('cuss', cuss);

            const items = itemData.map(item => ({
                productid: item.productid,
                sku: item.sku.split('_')[0],
                unit: item.sku.split('_')[1],
                name: item.name,
                number: item.number,
                pricepernumber: item.pricepernumber,
                totalprice: item.totalprice
            }));

            const totalprint = data[i].totalprint ?? 0;
            const taxInStatus = data[i].statusprintinv === 'TaxInvoice' ? 'ขอใบกำกับภาษี' : '';
            const statusText = {
                'Success': 'สำเร็จ',
                'Voided': 'ยกเลิก',
                'Waiting': 'รอส่ง',
                'Pending': 'รอโอน'
            }[data[i].status] || 'พบข้อผิดพลาด';

            const paymentstatusText = {
                'Paid': 'ชำระแล้ว',
                'Voided': 'ยกเลิก',
                'Pending': 'รอชำระ'
            }[data[i].paymentstatus] || 'พบข้อผิดพลาด';

            const isCOD = data[i].isCOD == '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง';

            const order = {
                id: data[i].id,
                cono: data[i].cono,
                invno: data[i].invno,
                orderdate: data[i].orderdate,
                orderdateString: data[i].orderdateString,
                printdate: currentDate,
                printdatetime: currentDateTime,
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
                statusprintinv: data[i].statusprintinv,
                invstatus: taxInStatus,
                totalprint: totalprint,
                saleschannel: data[i].saleschannel,
                item: items,
                customer: cuss,
                isCOD: isCOD
            };
            orders.push(order);
        }
        return orders;
    } catch (error) {
        console.error(error);
        return { status: 'dataNotFound' };
    }
}

module.exports = receiptWaitTab;