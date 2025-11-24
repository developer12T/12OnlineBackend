const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
// const axios = require('axios'); 
const getOrder12TIntoM3 = express.Router();
const axios = require('axios')
const { Order, OrderDetail, OrderHis, OrderDetailHis } = require('../model/Order');
const { orderMovement } = require('../model/Ordermovement');
const { Customer } = require('../model/Customer');
const { logTable } = require('../model/Logtable')
const { sequelize } = require('../config/database');
require('dotenv').config();

require('moment/locale/th');
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm');

getOrder12TIntoM3.post('/getOrder12TIntoM3', async (req, res) => {

    const action = req.body.action
    const action2 = req.body.action2
    const { date } = req.body;

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
                for (const data of data2) {

                    //   const dataOrder = await Order.findAll({where:{id:data[i].id}}) 

                    const query = `
    INSERT INTO [dbo].[orderSuccessInsM3] (id,[ordertype],[number],[customerid],[warehousecode],[status],[paymentstatus],[marketplacename],[marketplaceshippingstatus],[marketplacepayment],[amount],[vatamount] ,[shippingvat],[shippingchannel],
    [shippingamount],[shippingdate],[shippingdateString],[shippingname],[shippingaddress] ,[shippingphone] ,[shippingemail],[shippingpostcode],[shippingprovince],[shippingdistrict] ,[shippingsubdistrict],[shippingstreetAddress],
    [orderdate],[orderdateString],[paymentamount],[description],[discount],[platformdiscount],[sellerdiscount],[shippingdiscount],[discountamount],[voucheramount],[vattype],[saleschannel],[vatpercent],[isCOD],[createdatetime],
    [createdatetimeString],[updatedatetime],[updatedatetimeString],[expiredate],[expiredateString],[receivedate],[receivedateString],[totalproductamount],[uniquenumber],[properties],[isDeposit],[statusprint],[statusprintINV],[statusPrininvSuccess],[cono],[invno],[totalprint]) 
    VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22,:value23,:value24,:value25,
    :value26,:value27,:value28,:value29,:value30,:value31,:value32,:value33,:value34,:value35,:value36,:value37,:value38,:value39,:value40,:value41,:value42,:value43,:value44,:value45,:value46,:value47,:value48,:value49,:value50,:value51,:value52,:value53,:value54,:value55,:value56,:value57,:value58)
    
    `;

                    const replacements = {
                        value1: data.id, value11: data.amount, value21: data.shippingemail, value31: data.discount, value41: data.createdatetime, value51: data.properties,
                        value2: data.ordertype, value12: data.vatamount, value22: data.shippingpostcode, value32: data.platformdiscount, value42: data.createdatetimeString, value52: data.isDeposit,
                        value3: data.number, value13: data.shippingvat, value23: data.shippingprovince, value33: data.sellerdiscount, value43: data.updatedatetime, value53: data.statusprint,
                        value4: data.customerid, value14: data.shippingchannel, value24: data.shippingdistrict, value34: data.shippingdiscount, value44: data.updatedatetimeString, value54: data.statusprintinv, // status req inv
                        value5: data.warehousecode, value15: data.shippingamount, value25: data.shippingsubdistrict, value35: data.discountamount, value45: data.expiredate, value55: data.statusPrininvSuccess,
                        value6: data.status, value16: data.shippingdate, value26: data.shippingstreetAddress, value36: data.voucheramount, value46: data.expiredateString, value56: data.cono,
                        value7: data.paymentstatus, value17: data.shippingdateString, value27: data.orderdate, value37: data.vattype, value47: data.receivedate, value57: data.invno,
                        value8: data.marketplacename, value18: data.shippingname, value28: data.orderdateString, value38: data.saleschannel, value48: data.receivedateString, value58: data.totalprint,
                        value9: data.marketplaceshippingstatus, value19: data.shippingaddress, value29: data.paymentamount, value39: data.vatpercent, value49: data.totalproductamount,
                        value10: data.marketplacepayment, value20: data.shippingphone, value30: data.description, value40: data.isCOD, value50: data.uniquenumber,
                    }
                    const result = await sequelize.query(query, {
                        replacements,
                        type: sequelize.QueryTypes.INSERT
                    });

                    //   await OrderHis.create(dataOrder.dataValues); 

                    const dataDetailOrder = await OrderDetail.findAll({
                        attributes: { exclude: ['auto_id'] },
                        where: { id: data.id }
                    });

                    for (const orderdetail of dataDetailOrder) {
                        /* await OrderDetailHis.create({
                                 id: orderdetail.id ,
                                 productid: orderdetail.productid,
                                 numberOrder:orderdetail.numberOrder,
                                 sku:orderdetail.sku,
                                 name:orderdetail.name,
                                 procode:orderdetail.procode,
                                 number:orderdetail.number,
                                 pricepernumber:orderdetail.pricepernumber,
                                 discount:orderdetail.discount,
                                 discountamount:orderdetail.discountamount,
                                 totalprice:orderdetail.totalprice,
                                 producttype:orderdetail.producttype,
                                 serialnolist:orderdetail.serialnolist,
                                 expirylotlist:orderdetail.expirylotlist,
                                 skutype:orderdetail.skutype,
                                 bundleid:orderdetail.bundleid,
                                 bundleitemid:orderdetail.bundleitemid,
                                 bundlenumber:orderdetail.bundlenumber,
                                 bundleCode:orderdetail.bundleCode,
                                 bundleName:orderdetail.bundleName,
                                 integrationItemId:orderdetail.integrationItemId,
                                 integrationVariantId:orderdetail.integrationVariantId,
     
                         });*/
                        // edit 
                        const query = `
                        INSERT INTO [orderDetailSuccessInsM3] ([id],[numberOrder],[productid],[sku],[name],[procode],[number],[pricepernumber],[discount],[discountamount],[totalprice],[producttype],
                                                                [serialnolist],[expirylotlist],[skutype],[bundleid],[bundleitemid],[bundlenumber],[bundleCode],[bundleName],[integrationItemId],[integrationVariantId]) 
                        VALUES (:value1,:value2,:value3,:value4,:value5,:value6,:value7,:value8,:value9,:value10,:value11,:value12,:value13,:value14,:value15,:value16,:value17,:value18,:value19,:value20,:value21,:value22)
                        `;

                        const replacements = {
                            value1: orderdetail.id, value2: orderdetail.numberOrder, value3: orderdetail.productid, value4: orderdetail.sku, value5: orderdetail.name, value6: orderdetail.procode, value7: orderdetail.number, value8: orderdetail.pricepernumber, value9: orderdetail.discount, value10: orderdetail.discountamount,
                            value11: orderdetail.totalprice, value12: orderdetail.producttype, value13: orderdetail.serialnolist, value14: orderdetail.expirylotlist, value15: orderdetail.skutype, value16: orderdetail.bundleid, value17: orderdetail.bundleitemid, value18: orderdetail.bundlenumber, value19: orderdetail.bundleCode,
                            value20: orderdetail.bundleName, value21: orderdetail.integrationItemId, value22: orderdetail.integrationVariantId,

                        }
                        const result = await sequelize.query(query, {
                            replacements,
                            type: sequelize.QueryTypes.INSERT
                        });

                        await Order.destroy({ where: { id: data.id } });
                        await OrderDetail.destroy({ where: { id: data.id } });
                        await orderMovement.destroy({ where: { id: data.id } })
                        await logTable.create({ number: data.number, action: `Insert Into M3 complete}`, createdAt: currentDate })

                    }
                }
            }

            res.status(200).json(data2);

        } else {

            const response = await axios.post(process.env.API_URL + '/M3API/OrderManage/order/getOrderErp', {}, {});
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

                    const dataOrder = await Order.findAll({ where: { id: data[i].id } })
                    for (const order of dataOrder) {
                        await OrderHis.create(order.dataValues);
                    }
                    const dataDetailOrder = await OrderDetail.findAll({ where: { id: data[i].id } })
                    for (const orderdetail of dataDetailOrder) {
                        await OrderDetailHis.create(orderdetail.dataValues);
                    }

                    await Order.destroy({ where: { id: data[i].id } });
                    await OrderDetail.destroy({ where: { id: data[i].id } });
                    await orderMovement.destroy({ where: { id: data[i].id } })

                }
            }

            res.status(200).json(orders);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching the data.' });
    }

});

module.exports = getOrder12TIntoM3;    