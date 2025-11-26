const orderModel = require('../../MONGO/models/orderMongo')
const { OrderHis, OrderDetailHis, Order, OrderDetail } = require('../../zort/model/Order')
const { Op } = require('sequelize');
const { getModelsByChannel } = require('../../authen/middleware/channel')

exports.index = async (req, res) => {
    try {

        res.status(200).json({
            status: 200,
            message: 'Hello Mongo'
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
}


exports.addOrderToMongo = async (req, res) => {
    try {

        const channel = req.headers['x-channel']
        const { Ordermongo } = getModelsByChannel(channel, res, orderModel)

        const orderHead = await Order.findAll({
            where: {
                paymentstatus: 'paid',
                status: 'Success'
            }
        });

        const numberId = [...new Set(orderHead.flatMap(item => item.number))];
        const customerIdList = [...new Set(orderHead.flatMap(item => item.customerid))];

        

        const orderLine = await OrderDetail.findAll({
            where: {
                numberOrder: {
                    [Op.in]: numberId
                }
            }
        });

        let orderMongo = []


        for (const row of orderHead) {

            const orderDetail = orderLine.filter(item => item.numberOrder === row.number);

            const detail = orderDetail.map(item => item.dataValues || item);

            if (type === 'new') {
                const dataTran = {
                    id: row.id,
                    cono: row.cono,
                    invno: row.invno,
                    ordertype: row.ordertype,
                    number: row.number,
                    customerid: row.customerid,
                    customeriderp: row.customeriderp,
                    warehousecode: row.warehousecode,
                    status: row.status,
                    paymentstatus: row.paymentstatus,
                    marketplacename: row.marketplacename,
                    marketplaceshippingstatus: row.marketplaceshippingstatus,
                    marketplacepayment: row.marketplacepayment,
                    listProduct: detail,
                    amount: row.amount,
                    vatamount: row.vatamount,
                    shippingvat: row.shippingvat,
                    shippingchannel: row.shippingchannel,
                    shippingamount: row.shippingamount,
                    shippingdate: row.shippingdate,
                    shippingdateString: row.shippingdateString,
                    shippingname: row.shippingname,
                    shippingaddress: row.shippingaddress,
                    shippingphone: row.shippingphone,
                    shippingemail: row.shippingemail,
                    shippingpostcode: row.shippingpostcode,
                    shippingprovince: row.shippingprovince,
                    shippingdistrict: row.shippingdistrict,
                    shippingsubdistrict: row.shippingsubdistrict,
                    shippingstreetAddress: row.shippingstreetAddress,
                    trackingno: row.trackingno,
                    orderdate: row.orderdate,
                    orderdateString: row.orderdateString,
                    paymentamount: row.paymentamount,
                    description: row.description,
                    discount: row.discount,
                    platformdiscount: row.platformdiscount,
                    sellerdiscount: row.sellerdiscount,
                    shippingdiscount: row.shippingdiscount,
                    discountamount: row.discountamount,
                    voucheramount: row.voucheramount,
                    vattype: row.vattype,
                    saleschannel: row.saleschannel,
                    vatpercent: row.vatpercent,
                    payments: row.payments,
                    isCOD: row.isCOD,
                    tag: row.tag,
                    createdatetime: row.createdatetime,
                    createdatetimeString: row.createdatetimeString,
                    updatedatetime: row.updatedatetime,
                    updatedatetimeString: row.updatedatetimeString,
                    expiredate: row.expiredate,
                    expiredateString: row.expiredateString,
                    receivedate: row.receivedate,
                    receivedateString: row.receivedateString,
                    trackingList: row.trackingList,
                    totalproductamount: row.totalproductamount,
                    uniquenumber: row.uniquenumber,
                    properties: row.properties,
                    isDeposit: row.isDeposit,
                    statusprint: row.statusprint,
                    totalprint: row.totalprint,
                    statusprintinv: row.statusprintinv,
                    statusPrininvSuccess: row.statusPrininvSuccess,
                    // listProduct: detail

                };
                Ordermongo.create(dataTran)
            } else if (type === 'old') {
                const dataTran = {

                    type:row.saleschannel,
                    orderId : row.number,
                    sale : {
                        saleCode:'',
                        salePayer:"",
                        name:"",
                        tel:"",
                        warehouse:""
                    },
                    store: {
                        storeId:row.customerid,
                        name:'',
                        type:row.saleschannel,
                        address:"",
                        taxId:"",
                        tel:"",
                        area:"",
                        zone:""
                    },
                    shipping:{
                        default:'',
                        shippingId:row.shippingchannel,
                        address:row.shippingaddress,
                        district:row.shippingdistrict,
                        subDistrict:row.shippingsubdistrict,
                        province:row.shippingprovince,
                        postCode:row.shippingpostcode,
                        latitude:"0.00",
                        longtitude:"0.00",
                    },
                    note:'',
                    latitude:'',
                    longitude:'',
                    status:"",
                    statusTH:"",
                    listProduct:{

                    },
                    subtotal:0,
                    discount:0,
                    vat:0,
                    totalExVat:0,
                    qr:0,
                    total:0,
                    paymentMethod:'',
                    paymentStatus:row.paymentstatus,
                    reference:'',
                    period:'',





                }





            }


            // console.log(dataTran);
            orderMongo.push(dataTran)

        }




        res.status(200).json({
            status: 200,
            message: 'addproduct success',
            data: orderMongo
        })


    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
}