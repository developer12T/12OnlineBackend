const { Op } = require('sequelize');

const sequelize = require('sequelize')
const moment = require('moment');
const orderModel = require('../model/order')
const customerModel = require('../model/customer')
const productModel = require('../model/product');
const shippingModel = require('../model/shipping');
const logTableModel = require('../model/logtable')
const { getModelsByChannel } = require('../authen/middleware/channel')
const { getInvNumber, getNumberSeriesINV, getNumberSeries } = require('../M3API/controller/getOrder')
const { updateNumberRunning,updateNumberRunningINV } = require('../M3API/controller/updateNumberRunning');
const product = require('../model/product');



async function getOrderErp() {
    const sequelize = createSequelize()

    try {
        const query = `
      SELECT OAOREF FROM [dbo].[data_order_test]
    `

        const result = await sequelize.query(query, {
            type: Sequelize.QueryTypes.SELECT
        })

        // แปลงรูปแบบ
        const data_orders = result.map(row => ({
            number: row.OAOREF
        }))

        // distinct
        const combinedData = Array.from(
            new Map(data_orders.map(item => [item.number, item])).values()
        )

        return combinedData

    } catch (error) {
        console.error(error)
        throw error
    } finally {
        await sequelize.close()
    }
}

async function insertOrderToErp(action, action2, dateStr = {}) {

    const channel = 'uat'
    const { Order } = getModelsByChannel(channel, null, orderModel)
    const { Customer } = getModelsByChannel(channel, null, customerModel)
    const { Shipping } = getModelsByChannel(channel, null, shippingModel)

    const { date } = dateStr;

    const whereClause = {
        [Op.or]: [
            { statusPrininvSuccess: '001' },
            { statusPrininvSuccess: '002' },
            { statusprint: '001' },
            { statusprint: '002' },
        ],
        totalprint: { [Op.gte]: 1 },
    };

    // ✅ add date filter only if provided
    if (date) {
        whereClause.updatedatetime = date; // direct string compare
    }


    try {

        if (action2 == 'moveorder') {

            const data2 = await Order.findAll({
                where: whereClause,
            });
            if (action == 'InsertM3') {
                //   for (let i = 0; i < data.length; i++) {
                //             for (const data of data2) {

                //                 //   const dataOrder = await Order.findAll({where:{id:data[i].id}}) 

                //                 const query = `
                // INSERT INTO [dbo].[orderSuccessInsM3] (id,[ordertype],[number],[customerid],[warehousecode],[status],[paymentstatus],[marketplacename],[marketplaceshippingstatus],[marketplacepayment],[amount],[vatamount] ,[shippingvat],[shippingchannel],
                // [shippingamount],[shippingdate],[shippingdateString],[shippingname],[shippingaddress] ,[shippingphone] ,[shippingemail],[shippingpostcode],[shippingprovince],[shippingdistrict] ,[shippingsubdistrict],[shippingstreetAddress],
                // [orderdate],[orderdateString],[paymentamount],[description],[discount],[platformdiscount],[sellerdiscount],[shippingdiscount],[discountamount],[voucheramount],[vattype],[saleschannel],[vatpercent],[isCOD],[createdatetime],
                // [createdatetimeString],[updatedatetime],[updatedatetimeString],[expiredate],[expiredateString],[receivedate],[receivedateString],[totalproductamount],[uniquenumber],[properties],[isDeposit],[statusprint],[statusprintINV],[statusPrininvSuccess],[cono],[invno],[totalprint]) 
                // VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25,
                // :value26,:value27,:value28,:value29,:value30,:value31,:value32,:value33,:value34,:value35,:value36,:value37,:value38,:value39,:value40,:value41,:value42,:value43,:value44,:value45,:value46,:value47,:value48,:value49,:value50,:value51,:value52,:value53,:value54,:value55,:value56,:value57,:value58)

                // `;

                //                 const replacements = {
                //                     value1: data.id, value11: data.amount, value21: data.shippingemail, value31: data.discount, value41: data.createdatetime, value51: data.properties,
                //                     value2: data.ordertype, value12: data.vatamount, value22: data.shippingpostcode, value32: data.platformdiscount, value42: data.createdatetimeString, value52: data.isDeposit,
                //                     value3: data.number, value13: data.shippingvat, value23: data.shippingprovince, value33: data.sellerdiscount, value43: data.updatedatetime, value53: data.statusprint,
                //                     value4: data.customerid, value14: data.shippingchannel, value24: data.shippingdistrict, value34: data.shippingdiscount, value44: data.updatedatetimeString, value54: data.statusprintinv, // status req inv
                //                     value5: data.warehousecode, value15: data.shippingamount, value25: data.shippingsubdistrict, value35: data.discountamount, value45: data.expiredate, value55: data.statusPrininvSuccess,
                //                     value6: data.status, value16: data.shippingdate, value26: data.shippingstreetAddress, value36: data.voucheramount, value46: data.expiredateString, value56: data.cono,
                //                     value7: data.paymentstatus, value17: data.shippingdateString, value27: data.orderdate, value37: data.vattype, value47: data.receivedate, value57: data.invno,
                //                     value8: data.marketplacename, value18: data.shippingname, value28: data.orderdateString, value38: data.saleschannel, value48: data.receivedateString, value58: data.totalprint,
                //                     value9: data.marketplaceshippingstatus, value19: data.shippingaddress, value29: data.paymentamount, value39: data.vatpercent, value49: data.totalproductamount,
                //                     value10: data.marketplacepayment, value20: data.shippingphone, value30: data.description, value40: data.isCOD, value50: data.uniquenumber,
                //                 }
                //                 const result = await sequelize.query(query, {
                //                     replacements,
                //                     type: sequelize.QueryTypes.INSERT
                //                 });

                //                 //   await OrderHis.create(dataOrder.dataValues); 

                //                 const dataDetailOrder = await OrderDetail.findAll({
                //                     attributes: { exclude: ['auto_id'] },
                //                     where: { id: data.id }
                //                 });

                //                 for (const orderdetail of dataDetailOrder) {
                //                     /* await OrderDetailHis.create({
                //                              id: orderdetail.id ,
                //                              productid: orderdetail.productid,
                //                              numberOrder:orderdetail.numberOrder,
                //                              sku:orderdetail.sku,
                //                              name:orderdetail.name,
                //                              procode:orderdetail.procode,
                //                              number:orderdetail.number,
                //                              pricepernumber:orderdetail.pricepernumber,
                //                              discount:orderdetail.discount,
                //                              discountamount:orderdetail.discountamount,
                //                              totalprice:orderdetail.totalprice,
                //                              producttype:orderdetail.producttype,
                //                              serialnolist:orderdetail.serialnolist,
                //                              expirylotlist:orderdetail.expirylotlist,
                //                              skutype:orderdetail.skutype,
                //                              bundleid:orderdetail.bundleid,
                //                              bundleitemid:orderdetail.bundleitemid,
                //                              bundlenumber:orderdetail.bundlenumber,
                //                              bundleCode:orderdetail.bundleCode,
                //                              bundleName:orderdetail.bundleName,
                //                              integrationItemId:orderdetail.integrationItemId,
                //                              integrationVariantId:orderdetail.integrationVariantId,

                //                      });*/
                //                     // edit 
                //                     const query = `
                //                     INSERT INTO [orderDetailSuccessInsM3] ([id],[numberOrder],[productid],[sku],[name],[procode],[number],[pricepernumber],[discount],[discountamount],[totalprice],[producttype],
                //                                                             [serialnolist],[expirylotlist],[skutype],[bundleid],[bundleitemid],[bundlenumber],[bundleCode],[bundleName],[integrationItemId],[integrationVariantId]) 
                //                     VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22)
                //                     `;

                //                     const replacements = {
                //                         value1: orderdetail.id, value2: orderdetail.numberOrder, value3: orderdetail.productid, value4: orderdetail.sku, value5: orderdetail.name, value6: orderdetail.procode, value7: orderdetail.number, value8: orderdetail.pricepernumber, value9: orderdetail.discount, value10: orderdetail.discountamount,
                //                         value11: orderdetail.totalprice, value12: orderdetail.producttype, value13: orderdetail.serialnolist, value14: orderdetail.expirylotlist, value15: orderdetail.skutype, value16: orderdetail.bundleid, value17: orderdetail.bundleitemid, value18: orderdetail.bundlenumber, value19: orderdetail.bundleCode,
                //                         value20: orderdetail.bundleName, value21: orderdetail.integrationItemId, value22: orderdetail.integrationVariantId,

                //                     }
                //                     const result = await sequelize.query(query, {
                //                         replacements,
                //                         type: sequelize.QueryTypes.INSERT
                //                     });

                //                     await Order.destroy({ where: { id: data.id } });
                //                     await OrderDetail.destroy({ where: { id: data.id } });
                //                     await orderMovement.destroy({ where: { id: data.id } })
                //                     await logTable.create({ number: data.number, action: `Insert Into M3 complete}`, createdAt: currentDate })

                //                 }
                //             }
            }

            res.status(200).json(data2);

        } else {

            const response = await getOrderErp()
            const listid = response.data

            //   const data4 = await OrderHis.findAll({
            const data4 = await Order.findAll({
                where: {
                    [Op.or]: [
                        { statusPrininvSuccess: '001' },
                        { statusPrininvSuccess: '002' },
                        { statusprint: '001' },
                        { statusprint: '002' },
                    ],
                    totalprint: {
                        [Op.gte]: 1
                    }
                }
            });

            const existingIds = listid.map(item => item.number);
            const newDataList = data4.filter(item => !existingIds.includes(item.number));
            const filteredDataList = [];
            for (const item of newDataList) {
                if (item.status !== "Voided") {
                    filteredDataList.push(item);
                }
            }

            const data = filteredDataList
            const orders = [];

            for (let i = 0; i < data.length; i++) {
                //   const itemData = await OrderDetailHis.findAll({
                const itemData = await OrderDetail.findAll({
                    attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice', 'procode', 'discount'],
                    where: {
                        id: data[i].id
                    }
                });

                const cusdata = await Customer.findAll({
                    attributes: ['customername', 'customercode'],
                    where: {
                        customerid: data[i].customerid
                    }
                })

                const cuss = cusdata[0].customername;
                const cuscode = cusdata[0].customercode
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
                    totalprice: item.totalprice,
                    procode: item.procode,
                    discount: item.discount
                }));

                const order = {
                    id: data[i].id,
                    // saleschannel: data[i].saleschannel,
                    orderdate: data[i].orderdate,
                    orderdateString: data[i].orderdateString,
                    updatedatetime: data[i].updatedatetime,
                    cono: data[i].cono,
                    inv: data[i].invno,
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
                    createdatetime: data[i].createdatetime,
                    statusprint: data[i].statusprint,
                    totalprint: data[i].totalprint,
                    saleschannel: data[i].saleschannel,
                    customer: cuss,
                    customercode: cuscode,
                    item: items,

                };
                orders.push(order);

                if (action == 'InsertM3') {

                    // const dataOrder = await Order.findAll({ where: { id: data[i].id } })
                    // for (const order of dataOrder) {
                    //     await OrderHis.create(order.dataValues);
                    // }
                    // const dataDetailOrder = await OrderDetail.findAll({ where: { id: data[i].id } })
                    // for (const orderdetail of dataDetailOrder) {
                    //     await OrderDetailHis.create(orderdetail.dataValues);
                    // }

                    // await Order.destroy({ where: { id: data[i].id } });
                    // await OrderDetail.destroy({ where: { id: data[i].id } });
                    // await orderMovement.destroy({ where: { id: data[i].id } })

                }
            }

            res.status(200).json(orders);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the data.' });
    }

}


async function getOrder12TIntoM3({ action, action2, date }) {

    const whereClause = {
        [Op.or]: [
            { statusPrininvSuccess: '001' },
            { statusPrininvSuccess: '002' },
            { statusprint: '001' },
            { statusprint: '002' },
        ],
        totalprint: { [Op.gte]: 1 },
    };

    if (date) {
        whereClause.updatedatetime = date;
    }

    try {

        if (action2 == 'moveorder') {

            const data2 = await Order.findAll({
                where: whereClause,
            });

            if (action == 'InsertM3') {
                for (const data of data2) {

                    const query = `
INSERT INTO [dbo].[orderSuccessInsM3] (id,[ordertype],[number],[customerid],[warehousecode],[status],[paymentstatus],[marketplacename],[marketplaceshippingstatus],[marketplacepayment],[amount],[vatamount],[shippingvat],[shippingchannel],
[shippingamount],[shippingdate],[shippingdateString],[shippingname],[shippingaddress],[shippingphone],[shippingemail],[shippingpostcode],[shippingprovince],[shippingdistrict],[shippingsubdistrict],[shippingstreetAddress],
[orderdate],[orderdateString],[paymentamount],[description],[discount],[platformdiscount],[sellerdiscount],[shippingdiscount],[discountamount],[voucheramount],[vattype],[saleschannel],[vatpercent],[isCOD],[createdatetime],
[createdatetimeString],[updatedatetime],[updatedatetimeString],[expiredate],[expiredateString],[receivedate],[receivedateString],[totalproductamount],[uniquenumber],[properties],[isDeposit],[statusprint],[statusprintINV],[statusPrininvSuccess],[cono],[invno],[totalprint]) 
VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25,
:value26,:value27,:value28,:value29,:value30,:value31,:value32,:value33,:value34,:value35,:value36,:value37,:value38,:value39,:value40,:value41,:value42,:value43,:value44,:value45,:value46,:value47,:value48,:value49,:value50,:value51,:value52,:value53,:value54,:value55,:value56,:value57,:value58)
`;

                    const replacements = {
                        value1: data.id, value11: data.amount, value21: data.shippingemail, value31: data.discount, value41: data.createdatetime, value51: data.properties,
                        value2: data.ordertype, value12: data.vatamount, value22: data.shippingpostcode, value32: data.platformdiscount, value42: data.createdatetimeString, value52: data.isDeposit,
                        value3: data.number, value13: data.shippingvat, value23: data.shippingprovince, value33: data.sellerdiscount, value43: data.updatedatetime, value53: data.statusprint,
                        value4: data.customerid, value14: data.shippingchannel, value24: data.shippingdistrict, value34: data.shippingdiscount, value44: data.updatedatetimeString, value54: data.statusprintinv,
                        value5: data.warehousecode, value15: data.shippingamount, value25: data.shippingsubdistrict, value35: data.discountamount, value45: data.expiredate, value55: data.statusPrininvSuccess,
                        value6: data.status, value16: data.shippingdate, value26: data.shippingstreetAddress, value36: data.voucheramount, value46: data.expiredateString, value56: data.cono,
                        value7: data.paymentstatus, value17: data.shippingdateString, value27: data.orderdate, value37: data.vattype, value47: data.receivedate, value57: data.invno,
                        value8: data.marketplacename, value18: data.shippingname, value28: data.orderdateString, value38: data.saleschannel, value48: data.receivedateString, value58: data.totalprint,
                        value9: data.marketplaceshippingstatus, value19: data.shippingaddress, value29: data.paymentamount, value39: data.vatpercent, value49: data.totalproductamount,
                        value10: data.marketplacepayment, value20: data.shippingphone, value30: data.description, value40: data.isCOD, value50: data.uniquenumber,
                    };

                    await sequelize.query(query, {
                        replacements,
                        type: sequelize.QueryTypes.INSERT
                    });

                    const dataDetailOrder = await OrderDetail.findAll({
                        attributes: { exclude: ['auto_id'] },
                        where: { id: data.id }
                    });

                    await logTable.create({ number: data.number, action: 'Insert Into M3 complete', createdAt: currentDate });
                }
            }

            return data2;

        } else {

            const response = await getOrderErp()

            const listid = response.data;

            const data4 = await Order.findAll({
                where: whereClause
            });

            const existingIds = listid.map(item => item.number);
            const newDataList = data4.filter(item => !existingIds.includes(item.number));
            const filteredDataList = newDataList.filter(item => item.status !== 'Voided');

            const orders = [];

            for (const row of filteredDataList) {

                const itemData = await OrderDetail.findAll({
                    attributes: ['productid', 'sku', 'name', 'number', 'pricepernumber', 'totalprice', 'procode', 'discount'],
                    where: { id: row.id }
                });

                const cusdata = await Customer.findAll({
                    attributes: ['customername', 'customercode'],
                    where: { customerid: row.customerid }
                });

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

                orders.push({
                    id: row.id,
                    orderdate: row.orderdate,
                    orderdateString: row.orderdateString,
                    updatedatetime: row.updatedatetime,
                    cono: row.cono,
                    inv: row.invno,
                    number: row.number,
                    customerid: row.customerid,
                    status: row.status,
                    paymentstatus: row.paymentstatus,
                    amount: row.amount,
                    vatamount: row.vatamount,
                    shippingamount: row.shippingamount,
                    totalprint: row.totalprint,
                    saleschannel: row.saleschannel,
                    customer: cusdata[0]?.customername,
                    customercode: cusdata[0]?.customercode,
                    item: items
                });
            }

            return orders;
        }

    } catch (error) {
        console.error(error);
        throw error;
    }
}






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

        const responseData = await getOrder12TIntoM3()

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

async function getItem(itemcode) {
  try {
    if (itemcode === null || itemcode === '' || itemcode === undefined) {
      const data = await Item.findAll({
        attributes: { exclude: ['id'] },
      })
      return data
    } else {
      const data = await Item.findAll({
        attributes: { exclude: ['id'] },
        where: { itemcode: itemcode }
      })
      return data
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}


async function getDataPrintReceipt(body) {
    try {
        const channel = 'uat'
        const { Order } = getModelsByChannel(channel, null, orderModel)
        const { Customer } = getModelsByChannel(channel, null, customerModel)
        const { Shipping } = getModelsByChannel(channel, null, shippingModel)
        const { Logtable } = getModelsByChannel(channel, null, logTableModel)
        const { Product } = getModelsByChannel(channel, null, productModel)
        // setInterval(today, 5000);
        const currentDate = moment().utcOffset(7).format('YYYY-MM-DD');
        const currentDate2 = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');
        const idOrder = body.list;
        console.log("idOrder",idOrder)
        console.log("action",body.action)
        if (body.action == 'UpdateInvoiceOrder') {

            const orderDatup = await Order.findOne({ cono: '1', id: { $in: idOrder } })

            // if((orderDatup === null) || (orderDatup === undefined) || (orderDatup === '')){
            if ((!orderDatup)) {
                console.log('empty');
            } else {

                let countUpdateorder = 0;
                let numberser = await getNumberSeries({
                    series: 'ง',
                    seriestype: '01',
                    companycode: 410,
                    seriesname: '071'
                }, {});
                let invser = await getInvNumber({
                    ordertype: '071'
                }, {});
                let invm3 = parseInt(invser.data[0].customerordno);
                const inv12T = await Order.findOne(
                    {},
                    { invno: 1, _id: 0 }
                ).sort({ invno: -1 }).lean();
                //   console.log(inv12T[0].invno);
                var inv12tcon = parseInt(inv12T.invno);
                if (invm3 > inv12tcon) {
                    var inNo = (parseInt(invser.data[0].customerordno));
                    var invnumber = inNo + 1;
                } else {
                    var inNo = (inv12tcon + 1);
                    var invnumber = inNo;
                }
                if (i == 0) {
                    var seNo = (numberser.data[0].lastno + 1);
                } else {
                    var seNo = (numberser.data[0].lastno + i);
                }
                var lastnumber = seNo;
                const updateRun = await Order.updateOne(
                    { id: orderDatup[i].id },
                    {
                        $set: {
                            cono: lastnumber,
                            invno: invnumber,
                            updatedatetime: currentDate
                        }
                    }
                );
                await Logtable.create({
                    number: orderDatup[i].number,
                    action: `run Inv : ${invnumber}`,
                    action1: `run Co : ${lastnumber}`,
                    createdAt: currentDate
                });
                countUpdateorder = i;

                // console.log(countUpdateorder);

                let numberser2 = await getNumberSeries( {
                    series: 'ง',
                    seriestype: '01',
                    companycode: 410,
                    seriesname: '071'
                }, {});

                var updateNumber = await updateNumberRunning( {
                    series: 'ง',
                    seriestype: '01',
                    companycode: 410,
                    seriesname: '071',
                    lastno: numberser2.data[0].lastno + countUpdateorder + 1
                }, {});
                console.log('no emptyp');
            }

            return orderDatup;

        } else {

            const data = await Order.aggregate([
                { $match: { id: idOrder } },

                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customerid',
                        foreignField: 'customerid',
                        as: 'customer'
                    }
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: 'shippings',
                        localField: 'customerid',
                        foreignField: 'shi_customerid',
                        as: 'address'
                    }
                },
                { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        _id: 0,
                        id: 1,
                        cono: 1,
                        invno: 1,
                        number: 1,
                        saleschannel: 1,
                        orderdateString: 1,
                        updatedatetime: 1,

                        listProduct: 1,
                        amount: 1,
                        totalproductamount: 1,
                        vatamount: 1,
                        shippingamount: 1,
                        discount: 1,
                        platformdiscount: 1,
                        sellerdiscount: 1,
                        shippingdiscount: 1,
                        discountamount: 1,
                        voucheramount: 1,

                        customer: {
                            customercode: '$customer.customercode',
                            customername: '$customer.customername',
                            customeraddress: '$customer.customeraddress',
                            customeridnumber: '$customer.customeridnumber'
                        },

                        address: {
                            shippingaddress: '$address.shippingaddress',
                            shippingpostcode: '$address.shippingpostcode'
                        }
                    }
                }
            ])


            const totalprint = await Order.findOne(
                { id: idOrder },
                {
                    totalprint: 1,
                    statusprint: 1,
                    statusPrininvSuccess: 1,
                    statusprintinv: 1,
                    _id: 0
                }
            ).lean()


            var ci = totalprint.totalprint + 1;
            if (totalprint.statusprint == '000') {
                var st = '001';
            } else if (totalprint.statusprint == '001') {
                var st = '002';
            }

            if (totalprint.statusprintinv == 'TaxInvoice') {

                let st;
                if (totalprint.statusPrininvSuccess == '000') {
                    st = '001';
                } else if (totalprint.statusPrininvSuccess == '001') {
                    st = '002';
                }

                if (st === '002') {
                    await Order.updateOne(
                        {
                            id: idOrder,
                            status: { $ne: 'Voided' }
                        },
                        {
                            $set: {
                                statusPrininvSuccess: st,
                                totalprint: ci
                            }
                        }
                    );
                } else {
                    await Order.updateOne(
                        {
                            id: idOrder,
                            status: { $ne: 'Voided' }
                        },
                        {
                            $set: {
                                statusPrininvSuccess: st,
                                totalprint: ci,
                                updatedatetime: currentDate,
                                updatedatetimeString: currentDate2
                            }
                        }
                    );
                }
            } else if (st === '002') {
                await Order.updateOne(
                    {
                        id: idOrder,
                        status: { $ne: 'Voided' }
                    },
                    {
                        $set: {
                            statusprint: st,
                            totalprint: ci
                        }
                    }
                );
            } else {
                await Order.updateOne(
                    {
                        id: idOrder,
                        status: { $ne: 'Voided' }
                    },
                    {
                        $set: {
                            statusprint: st,
                            totalprint: ci,
                            updatedatetime: currentDate,
                            updatedatetimeString: currentDate2
                        }
                    }
                );
            }

            if (body.action == 'lastRowActionToDataErp') {
                const response = await addOrderErp()
                // console.log('ERP Response:', 'lastRowActionToDataErp');
            }

            let itemdiscount = 0;
            for (let order of data) {
                const disDetail = order.listProduct.find(detail => detail.productid === 8888888);
                if (disDetail) {
                    itemdiscount = disDetail.pricepernumber;
                }
                for (let detail of order.listProduct) {
                    if (detail.productid !== 8888888) {
                        const [sku, flag] = detail.sku.split('_');
                        if (flag === "Free") {
                            const sku = detail.sku;
                            const item = await Product.findOne({sku:sku})
                            detail.name = '(สินค้าโปรโมชั่นแจกฟรี) ' + item.name;
                        } else {
                            const sku = detail.sku;
                            const item = await Product.findOne({sku:sku})
                            detail.name = item.name;
                        }
                    }
                }
            }
            // console.log('data[0]:', JSON.stringify(data, null, 2))


            const listBuy = data[0].listProduct.filter(detail => detail.productid !== 8888888);
            listBuy.sort((a, b) => b.productid - a.productid);

            const resdata = [{
                id: data[0].id,
                cono: data[0].cono,
                invno: data[0].invno,
                number: data[0].number,
                totalamount: data[0].amount,
                totalamountExVat: parseFloat(data[0].amount) - parseFloat(data[0].vatamount),
                productamount: parseInt(data[0].totalproductamount) + parseInt(data[0].shippingamount),
                discount: itemdiscount,
                vatamount: data[0].vatamount,
                shippingamount: data[0].shippingamount,
                updatedatetime: data[0].updatedatetime,
                channel: data[0].saleschannel,
                printinv: data[0].statusprintinv,
                list: listBuy,
                customer: data[0].customer,
                address: data[0].shippingAddress,
            }];

            // console.log('resdata',resdata);
            return resdata;
        }

    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = {
  getDataPrintReceipt
}
