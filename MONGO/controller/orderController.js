const orderModel = require('../../MONGO/models/orderMongo')
const OrderOldModel = require('../../MONGO/models/orderMongoOld')
const customerModel = require('../../MONGO/models/customerMongo')
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


exports.addOrderAmazeMongo = async (req, res) => {
    try {
        const { Ordermongo } = getModelsByChannel(channel, res, OrderOldModel)
        const { CustomerMongo } = getModelsByChannel(channel, res, customerModel)
        const dataAmaze = await orderAmazeAll();
        
        if (!dataAmaze || !dataAmaze.data) {
            return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        const orders = dataAmaze.data;

        const customersToUpdate = [];
        const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, { expiresIn: '2h' })

        for (const order of orders) {

            // 2.ตรวจสอบข้อมูล
            // const existingOrder = await Order.findOne({ where: { number: order.order_number } }) || await OrderHis.findOne({ where: { number: order.order_number } });

            const existingOrder = await Ordermongo.findOne({orderId:order.order_number})


            if (!existingOrder) {
                const createdDateUTC = order.created_at
                // Convert to Bangkok time (+7)
                const dateObj = new Date(createdDateUTC)
                const options = {
                    timeZone: 'Asia/Bangkok',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false // 24-hour format
                }
                // Format Bangkok time correctly
                const bangkokTime = new Intl.DateTimeFormat('en-GB', options).format(
                    dateObj
                )

                const [date, time] = bangkokTime.replace(',', '').split(' ')
                const [year, month, day] = date.split('/')
                const finalDate = `${day}-${month}-${year}T${time}`

                const newOrderId = await generateUniqueId();
                const newCustomerId = await generateCustomerId();
                const shipping = order.order_address || {};
                const billing = order.billing_address || {};

                let customercode = ''
                // let customer = await Customer.findOne({ where: { customeriderp: order.customer_id } });
                let customer = await CustomerMongo.findOne({customeriderp: order.customer_id})

                const customerEmail = order.billing_address?.email || "";
                const customerTaxId = order.billing_address?.tax_id || "";
                const statusPrintInv = customerTaxId ? "TaxInvoice" : "";

                if (!customer) {
                    // customer = await Customer.create({
                    customer = await CustomerMongo.create({    
                        customerid: newCustomerId,
                        customeriderp: order.customer_id,
                        customercode: customerTaxId ? '' : "OAMZ000000",
                        customername: order.customer_name,
                        customeremail: customerEmail,
                        customerphone: order.billing_address?.phoneno || "",
                        customeraddress: `${order.billing_address?.address || ""} ${order.billing_address?.district || ""} ${order.billing_address?.sub_district || ""} ${order.billing_address?.province || ""} ${order.billing_address?.postcode || ""}`.trim(),
                        customerpostcode: order.billing_address?.postcode || "",
                        customerprovince: order.billing_address?.province || "",
                        customerdistrict: order.billing_address?.district || "",
                        customersubdistrict: order.billing_address?.sub_district || "",
                        customerstreetAddress: order.billing_address?.address || "",
                        customeridnumber: customerTaxId,
                        createddate: formatDate(order.created_at),
                    });
                } else {
                    if (!customer.customeridnumber && customerTaxId) {
                        await customer.update({ customeridnumber: customerTaxId });
                        await customer.update({ customercode: null });
                    }
                    if (!customer.customeridnumber) {
                        await customer.update({ customercode: "OAMZ000000" });
                    }
                    if (customer) {
                        customercode = customer.customercode || ''
                    }
                }
                if (customerTaxId) {
                    customersToUpdate.push({
                        orderid: newOrderId,
                        customerid: order.customer_id,
                        customeridnumber: customerTaxId,
                        customername: order.billing_address?.name || order.customer_name,
                        customeraddress: `${order.billing_address?.address || ""} ${order.billing_address?.district || ""} ${order.billing_address?.sub_district || ""} ${order.billing_address?.province || ""} ${order.billing_address?.postcode || ""}`.trim(),
                        customerpostcode: order.billing_address?.postcode || "",
                        shippingaddress: `${order.billing_address?.address || ""} ${order.billing_address?.district || ""} ${order.billing_address?.sub_district || ""} ${order.billing_address?.province || ""} ${order.billing_address?.postcode || ""}`.trim(),
                        shippingpostcode: order.billing_address?.postcode || "",
                        customerphone: order.billing_address?.phoneno || "",
                        saleschannel: 'Amaze'
                    });
                }

                // test add shipping address
                let shippingAddress = await ShippingAddress.create({
                    shi_customerid: customer ? customer.customerid : newCustomerId,
                    order_id: newOrderId,
                    shippingname: order.billing_address?.name || order.customer_name,
                    shippingaddress: `${order.order_address?.address_name || ""} ${order.order_address?.district_name || ""} ${order.order_address?.ward_name || ""} ${order.order_address?.city_name || ""} ${order.order_address?.postcode || ""}`.trim(),
                    shippingphone: order.order_address?.phoneno || "",
                    shippingpostcode: order.order_address?.postcode || "",
                    shippingprovince: order.order_address?.city_name || "",
                    shippingdistrict: order.order_address?.district || "",
                    shippingsubdistrict: order.order_address?.ward_name || "",
                });

                // test add order
                const newOrder = await Order.create({
                    id: newOrderId,
                    number: order.order_number,
                    cono: 1,
                    invno: '1',
                    ordertype: '0',
                    customerid: customer ? customer.customerid : newCustomerId,
                    customeriderp: customerTaxId ? customercode : "OAMZ000000",
                    status: order.order_packages[0].status === "cancelled"
                        ? "Voided"
                        : order.order_packages[0].status === "ready_to_ship"
                            ? "SHIPPING"
                            : order.order_packages[0].status,
                    paymentstatus: order.order_packages[0].status === "cancelled"
                        ? "Voided"
                        : order.order_packages[0].status === "ready_to_ship"
                            ? "paid"
                            : order.order_packages[0].status,
                    amount: order.order_packages[0].grand_total,
                    vatamount: ((order.order_packages[0].grand_total - (order.order_packages[0].grand_total / 1.07))).toFixed(2),
                    shippingamount: order.order_packages[0].shipping_amount,
                    shippingname: order.billing_address?.name || "",
                    shippingaddress: `${order.order_address?.address_name || ""} ${order.order_address?.district_name || ""} ${order.order_address?.ward_name || ""} ${order.order_address?.city_name || ""} ${order.order_address?.postcode || ""}`.trim(),
                    shippingphone: order.order_address?.phoneno || "",
                    shippingpostcode: order.order_address?.postcode || "",
                    shippingprovince: order.order_address?.province || "",
                    shippingdistrict: order.order_address?.district || "",
                    shippingsubdistrict: order.order_address?.ward_name || "",
                    shippingstreetAddress: order.order_address?.address || "",
                    orderdate: finalDate,
                    orderdateString: formatDate(order.created_at),
                    paymentamount: '0',
                    description: '',
                    discount: '0',
                    platformdiscount: '0',
                    sellerdiscount: '0',
                    discountamount: 0,
                    voucheramount: 0,
                    vattype: 3,
                    saleschannel: 'Amaze',
                    vatpercent: 7,
                    createdatetime: finalDate,
                    createdatetimeString: finalDate,
                    updatedatetime: finalDate,
                    updatedatetimeString: finalDate,
                    totalproductamount: order.order_packages[0].sub_total,
                    isDeposit: '0',
                    statusprint: '000',
                    statusPrininvSuccess: '000',
                    statusprintinv: statusPrintInv,
                });

                for (const orderPackage of order.order_packages) {
                    for (const orderLine of orderPackage.order_items) {
                        const product = await Product.findOne({ where: { sku: orderLine.sku } });
                        // console.log('orderLine', orderLine);
                        if (!product) {
                            console.warn(`Not Found SKU: ${orderLine.sku}`);
                            continue;
                        }
                        // test add order detail
                        await OrderDetail.create({
                            id: newOrder.id,
                            numberOrder: newOrder.number,
                            productid: product.id,
                            sku: orderLine.sku,
                            name: product.name,
                            pricepernumber: orderLine.unit_price,
                            totalprice: orderLine.grand_total,
                            number: orderLine.quantity_ordered,
                            unittext: product.unittext,
                            discountamount: orderLine.sub_total - orderLine.grand_total,
                        });

                        console.log(`Added Order Detail SKU: ${orderLine.sku}`);
                    }
                }
            }
        }






    } catch (error) {
        console.error(error)
        res.status(500).json({ status: '501', message: error.message })
    }
}