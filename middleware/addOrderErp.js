const express = require('express');
const addOrderErp = express.Router();
const addOrderErpRepair = express.Router();
const { Op, sequelize } = require('sequelize');
const axios = require('axios')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const { log } = require('console');
require('dotenv').config();
require('moment/locale/th');
// const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
const currentDate = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
const { OrderHis, OrderDetailHis, Order, OrderDetail } = require('../../zort/model/Order')
const { Customer } = require('../../zort/model/Customer')

async function addOrderErp(responseData) {

  const sequelize = new Sequelize(
    process.env.databaseerp,
    process.env.user,
    process.env.password,
    {
      dialect: process.env.dialact,
      host: process.env.server,
    }
  )

  try {
    const token = jwt.sign(
      { username: 'systemm3' },
      process.env.TOKEN_KEY,
      { expiresIn: '2h' }
    )

    const response = await axios.post(
      process.env.API_URL + '/zort/order/OrderManage/getOrder12TIntoM3',
      { token }
    )

    for (const orderData of responseData) {

      const list = orderData.item.sort((a, b) => {
        const regex = /^[0-9]/
        const aNum = regex.test(a.sku)
        const bNum = regex.test(b.sku)

        if (aNum && !bNum) return -1
        if (!aNum && bNum) return 1
        return a.sku.localeCompare(b.sku)
      })

      for (let i = 0; i < list.length; i++) {

        const query = `
          INSERT INTO [dbo].[data_order_test]
          (OAORDT,RLDT,ORNO,CUOR,OAORTP,WHLO,FACI,OAFRE1,OAOREF,OAYREF,
           CUNO,ADID,OBPONR,OBITNO,OBALUN,OBORQA,OBSAPR,OBDIA2,OBPIDE,
           OBSMCD,OARESP,CHANNEL,STATUS,INSERT_AT,UPDATE_AT)
          VALUES
          (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,
           :value9,:value10,:value11,:value12,:value13,:value14,:value15,
           :value16,:value17,:value18,:value19,:value20,:value21,:value22,
           :value23,:value24,:value25)
        `

        const orderdatenum = parseInt(
          orderData.updatedatetime.replace(/-/g, ''),
          10
        )

        // ===== unit =====
        let unittext = 'PCS'
        if (list[i].sku === 'ZNS1401001') unittext = 'JOB'
        if (list[i].unit) {
          unittext =
            list[i].unit === 'Free'
              ? 'PCS'
              : list[i].unit.slice(0, 3)
        }

        // ===== price =====
        const pricenumber = list[i].pricepernumber || 0

        // ===== procode =====
        const pcode = list[i].procode === 'FV2F' ? 'FV2F' : ''

        // ===== qty =====
        const qty =
          list[i].productid === '8888888'
            ? -list[i].number
            : list[i].number

        // ===== discount =====
        const dis2 = list[i].discount ? list[i].discount : 0

        const replacements = {
          value1: orderdatenum,
          value2: orderdatenum,
          value3: orderData.cono,
          value4: orderData.inv,
          value5: '071',
          value6: '108',
          value7: 'F10',
          value8: 'YSEND',
          value9: orderData.number,
          value10: '',
          value11: orderData.customercode,
          value12: '',
          value13: i + 1,
          value14: list[i].sku,
          value15: unittext,
          value16: qty,
          value17: pricenumber,
          value18: dis2,
          value19: pcode,
          value20: '11002',
          value21: 'SA02',
          value22: 'ONLINE',
          value23: 0,
          value24: new Date(),
          value25: new Date(),
        }

        await sequelize.query(query, {
          replacements,
          type: Sequelize.QueryTypes.INSERT
        })
      }
    }

    return { status: true, message: 'Insert ERP success' }

  } catch (error) {
    console.error(error)
    throw error
  }
}


addOrderErpRepair.post('/addOrderErpRepair', async (req, res) => {

    const sequelize = new Sequelize(process.env.databaseerp, process.env.user, process.env.password, {
        dialect: process.env.dialact,
        host: process.env.server,
    });

    try {
        const token = jwt.sign(
            { username: 'systemm3' },
            process.env.TOKEN_KEY,
            { expiresIn: '2h' })
        const oredersss = []

        // const ids = [
        // ];
        const ids = req.body.ids;

        for (let i = 0; i < ids.length; i++) {
            const data = await Order.findOne({ where: { cono: ids[i] } })

            const itemData = await OrderDetail.findAll({ where: { id: data.id } })

            const cusdata = await Customer.findAll({
                attributes: ['customername', 'customercode'],
                where: {
                    customerid: data.customerid
                }
            })

            const items = itemData.map(item => ({
                productid: item.productid,
                sku: item.sku.split('_')[0],
                unit: item.sku.split('_')[1],
                name: item.name,
                number: item.number,
                pricepernumber: item.pricepernumber,
                totalprice: item.totalprice,
                procode: item.procode,
                discount: item.discount
            }));
            const cuss = cusdata[0].customername;
            const cuscode = cusdata[0].customercode
            const revdata = {
                orderdate: data.orderdate,
                orderdateString: data.orderdateString,
                updatedatetime: data.updatedatetime,
                cono: data.cono,
                inv: data.invno,
                number: data.number,
                customerid: data.customerid,
                status: data.status,
                paymentstatus: data.paymentstatus,
                amount: data.amount,
                vatamount: data.vatamount,
                shippingchannel: data.shippingchannel,
                shippingamount: data.shippingamount,
                shippingstreetAddress: data.shippingstreetAddress,
                shippingsubdistrict: data.shippingsubdistrict,
                shippingdistrict: data.shippingdistrict,
                shippingprovince: data.shippingprovince,
                shippingpostcode: data.shippingpostcode,
                createdatetime: data.createdatetime,
                statusprint: data.statusprint,
                totalprint: data.totalprint,
                saleschannel: data.saleschannel,
                customer: cuss,
                customercode: cuscode,
                item: items,
            }
            oredersss.push(revdata)
        }


        for (const orderData of oredersss) {
            const list = orderData.item
                .sort((a, b) => {
                    const regex = /^[0-9]/;
                    const aStartsWithNumber = regex.test(a.sku);
                    const bStartsWithNumber = regex.test(b.sku);

                    if (aStartsWithNumber && !bStartsWithNumber) {
                        return -1;
                    } else if (!aStartsWithNumber && bStartsWithNumber) {
                        return 1;
                    } else {
                        return a.sku.localeCompare(b.sku);
                    }
                });

            for (let i = 0; i < list.length; i++) {
                console.log(i);
                const query = `
                    INSERT INTO [dbo].[data_order] (OAORDT,RLDT,ORNO,CUOR,OAORTP,WHLO,FACI,OAFRE1,OAOREF,OAYREF,CUNO,ADID,OBPONR,OBITNO,
                        OBALUN,OBORQA,OBSAPR,OBDIA2,OBPIDE,OBSMCD,OARESP,CHANNEL,STATUS,INSERT_AT,UPDATE_AT) 
                    VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,
                        :value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25) 
                    `;
                var orderdatenum = parseInt(orderData.updatedatetime.replace(/-/g, ''), 10)
                if (!list[i].unit) {
                    if (list[i].sku == 'ZNS1401001') {
                        var unittext = 'JOB'
                    } else {
                        var unittext = 'PCS'
                    }

                } else {
                    if (list[i].unit === 'Free') {
                        var unittext = 'PCS'
                    } else {
                        if (list[i].unit.length > 3) {
                            var unittext = list[i].unit.slice(0, 3)
                        } else {
                            var unittext = list[i].unit
                        }
                    }

                }

                if (list[i].pricepernumber == null) {
                    var pricenumber = 0
                } else {
                    var pricenumber = list[i].pricepernumber
                }
                if (!list[i].procode) {
                    if (list[i].procode == 'FV2F') {
                        var pcode = list[i].procode
                    } else {
                        var pcode = ''
                    }

                } else {
                    if (list[i].procode == 'FV2F') {
                        var pcode = list[i].procode
                    } else {
                        var pcode = ''
                    }
                }
                if (list[i].productid == '8888888') {
                    var qty = -list[i].number
                } else {
                    var qty = list[i].number
                }
                // console.log('akjsdhajklsdghjklasdg ::::'+list[i]);

                if (list[i].discount === null || list[i].discount === '' || list[i].discount === 0 || list[i].discount === '0') {
                    var dis2 = 0
                } else {
                    var dis2 = list[i].discount
                }

                const replacements = {
                    value1: orderdatenum, value11: orderData.customercode, value21: 'SA02',
                    value2: orderdatenum, value12: '', value22: 'ONLINE',
                    value3: orderData.cono, value13: i + 1, value23: 0,
                    value4: orderData.inv, value14: list[i].sku, value24: currentDate,
                    value5: '071', value15: unittext, value25: currentDate,
                    value6: '108', value16: qty,
                    value7: 'F10', value17: pricenumber,
                    value8: 'YSEND', value18: dis2,
                    value9: orderData.number, value19: pcode,
                    value10: '', value20: '11002',
                }
                const result = await sequelize.query(query, {
                    replacements,
                    type: sequelize.QueryTypes.INSERT
                });
            }
        }

        res.json(oredersss)
    } catch (error) {
        console.log(error)
        res.json(error.message)
    }
}),


module.exports = { addOrderErpRepair, addOrderErp }
