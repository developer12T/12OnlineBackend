const orderModel = require('../../MONGO/models/orderMongo')
const OrderOldModel = require('../../MONGO/models/orderMongoOld')
const { OrderHis, OrderDetailHis, Order, OrderDetail } = require('../../zort/model/Order')
const { Customer } = require('../../zort/model/Customer')
const { Product } = require('../../zort/model/Product')
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

        const { type } = req.body
        const channel = req.headers['x-channel']
        // const { Ordermongo } = getModelsByChannel(channel, res, orderModel)
        const { Ordermongo } = getModelsByChannel(channel, res, OrderOldModel)

        const orderHead = await Order.findAll({
            where: {
                paymentstatus: 'paid',
                status: 'Success'
            }
        });


        const numberId = [...new Set(orderHead.flatMap(item => item.number))];
        const customerIdList = [...new Set(orderHead.flatMap(item => item.customerid))];

        const customerData = await Customer.findAll({
            where: {
                customerid: {
                    [Op.in]: customerIdList
                }
            }
        });

        const orderLine = await OrderDetail.findAll({
            where: {
                numberOrder: {
                    [Op.in]: numberId
                }
            }
        });

        const skuList = [...new Set(orderLine.flatMap(item => item.sku))];

        const product = await Product.findAll({
            where: {
                sku: {
                    [Op.in]: skuList
                }
            }
        });


        let orderMongo = []
        let promotion = []

        for (const row of orderHead) {

            const orderDetail = orderLine.filter(item => item.numberOrder === row.number);

            const detail = orderDetail.map(item => item.dataValues || item);

            const customerDetail = customerData.find(item => item.customerid === row.customerid)

            let listProduct = detail.map(d => {
                if (d.procode != null && d.procode !== '') {
                    return null;
                }

                const productDetail = product.find(p => p.sku === d.sku);
                const unit = d.sku.slice(12, 15);

                return {
                    id: d.productId,
                    sku: d.sku,
                    name: d.name,
                    groupCode: productDetail?.categoryid ?? '',
                    group: productDetail?.category ?? '',
                    brandCode: '',
                    brand: '',
                    size: productDetail?.weight ?? '0',
                    flavourCode: '',
                    flavour: '',
                    qty: d.number,
                    unit: unit,
                    unitName: '',
                    price: d.pricepernumber,
                    subtotal: d.totalprice,
                    discount: '',
                    netTotal: d.totalprice
                };
            });

            // ลบ item ที่เป็น null ออก
            listProduct = listProduct.filter(Boolean);

            let listPromotions = detail.map(d => {
                // ข้ามเฉพาะรายการที่ไม่มี procode
                if (d.procode === null || d.procode === '') {
                    return null;
                }

                const productDetail = product.find(p => p.sku === d.sku);
                const unit = d.sku.slice(12, 15);

                return {
                    d
                    // ใส่ข้อมูลตามต้องการ
                    // procode: d.procode,
                    // productId: d.productId,
                    // sku: d.sku,
                    // unit,
                    // detail: productDetail
                }
            }).filter(Boolean);

            promotion.push(listPromotions)


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
                // Ordermongo.create(dataTran)
            } else if (type === 'old') {

                const orderExit = await Ordermongo.findOne({ orderId: row.number })
                if (!orderExit) {
                    const dataTran = {

                        type: row.saleschannel,
                        orderId: row.number,
                        sale: {
                            saleCode: '',
                            salePayer: "",
                            name: "",
                            tel: "",
                            warehouse: row.warehousecode
                        },
                        store: {
                            storeId: row.customerid,
                            name: customerDetail?.customername ?? '',
                            type: row.saleschannel,
                            address: customerDetail?.customeraddress ?? '',
                            taxId: "",
                            tel: customerDetail?.customerphone ?? '',
                            area: "",
                            zone: ""
                        },
                        shipping: {
                            default: '',
                            shippingId: row.shippingchannel,
                            address: row.shippingaddress,
                            district: row.shippingdistrict,
                            subDistrict: row.shippingsubdistrict,
                            province: row.shippingprovince,
                            postCode: row.shippingpostcode,
                            latitude: "0.00",
                            longtitude: "0.00",
                        },
                        note: '',
                        latitude: '0.00',
                        longitude: '0.00',
                        status: row.status,
                        statusTH: "",
                        listProduct: listProduct,
                        listPromotions: {},
                        subtotal: 0,
                        discount: Number(row?.discount || 0).toFixed(2),
                        vat: parseFloat((row.amount - row.amount / 1.07).toFixed(2)),
                        totalExVat: parseFloat((row.amount / 1.07).toFixed(2)),
                        qr: 0,
                        total: parseFloat(row.amount),
                        paymentMethod: '',
                        paymentStatus: row.paymentstatus,
                        reference: '',
                        period: '',
                    }
                    orderMongo.push(dataTran)
                    Ordermongo.create(dataTran)
                }
            }


            // console.log(dataTran);
            // orderMongo.push(dataTran)

        }




        res.status(200).json({
            status: 200,
            message: 'addproduct success',
            data: orderMongo
            // data : customerData
        })


    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
}