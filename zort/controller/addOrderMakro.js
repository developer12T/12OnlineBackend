const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const addOrderMakro = express.Router();
const jwt = require('jsonwebtoken');
const pm2 = require('pm2')
const orderMakroAll = require('../dataZort/allOrderMakro');
const { v4: uuidv4 } = require("uuid");

const { Order, OrderDetail, OrderHis } = require('../model/Order');
const { Customer, ShippingAddress } = require('../model/Customer');
const { orderMovement } = require('../model/Ordermovement');
const { Product } = require('../model/Product')
const { logTable } = require('../model/Logtable')

const { sequelize } = require('../config/database');
// const moment = require("moment-timezone");

const generateUniqueId = async () => {
    let uniqueId;
    let exists;

    do {
        uniqueId = parseInt(uuidv4().replace(/\D/g, "").slice(0, 9), 10);

        if (uniqueId > 2147483647) {
            uniqueId = uniqueId % 2000000000 + 100000000;
        }

        exists = await Order.findOne({ where: { id: uniqueId } }) || await OrderHis.findOne({ where: { id: uniqueId } });

    } while (exists);

    return uniqueId;
};

const generateCustomerId = async () => {
    let uniqueId;
    let exists;

    do {
        uniqueId = Math.floor(10000000 + Math.random() * 90000000);

        exists = await Customer.findOne({ where: { customerid: uniqueId } });

    } while (exists);

    return uniqueId;
};


const formatDate = (isoDate) => {
    return isoDate ? new Date(isoDate).toISOString().split("T")[0] : null;
};

addOrderMakro.get('/addOrderMakroProDetailFix', async (req, res) => {
    try {

        const orderIds = [
            'MAKROPRO25045383B',
            'MAKROPRO25217875B',
            'MAKROPRO25200397B'
        ];

        // ✅ แปลงให้ทุกตัวมี "-A" ต่อท้าย
        const convertedIds = orderIds.map(id => `${id}-A`);

        // ✅ รวมเป็น comma-separated string
        const orderIdsParam = convertedIds.join(',');

        console.log('Order IDs:', orderIdsParam);

        const response = await axios.get(process.env.urlMakro + `/api/orders?order_ids=${orderIdsParam}`, {
            headers: {
                Accept: 'application/json',
                Authorization: process.env.frontKeyMakro
            },
        },);


        let maxLoop = Math.ceil(response.data.total_count / 100);
        let allOrders = [...response.data.orders];
        let totalCount = response.data.total_count;
        // ถ้ามีแค่หน้าเดียว
        if (maxLoop > 1) {
            for (let i = 1; i < maxLoop; i++) {
                let offset = i * 100;
                const res = await axios.get(
                    `${process.env.urlMakro}/api/orders?order_state_codes=SHIPPING&max=100&offset=${offset}&order=asc`,
                    {
                        headers: {
                            Accept: 'application/json',
                            Authorization: process.env.frontKeyMakro
                        }
                    }
                );
                allOrders.push(...res.data.orders);
            }
        }
        const finalData = {
            orders: allOrders,
            total_count: totalCount
        };
        for (const order of finalData.orders) {
            const existingOrder = await Order.findOne({
                where: { number: order.commercial_id },
            });
            if (!existingOrder) {
                console.warn(`❌ Order not found in DB: ${order.commercial_id}`);
                continue; // ข้ามไปถ้าไม่เจอ order
            }

            const newOrder = {
                id: existingOrder.id, // ✅ ใช้ id ที่หาได้จาก DB
                number: order.commercial_id,
                cono: 1,
                invno: '1',
                ordertype: '0',
                status: order.order_state,
                paymentstatus: order.references.order_reference_for_customer || '',
                amount: order.total_price,
                vatamount: ((order.total_price - (order.total_price / 1.07))).toFixed(2),
                shippingamount: order.shipping_price,
                orderdateString: formatDate(order.created_date),
                paymentamount: '0',
                description: '',
                discount: '0',
                platformdiscount: '0',
                sellerdiscount: '0',
                discountamount: 0,
                voucheramount: 0,
                vattype: 3,
                saleschannel: 'Makro',
                vatpercent: 7,
                totalproductamount: order.total_price,
                isDeposit: '0',
                statusprint: '000',
                statusPrininvSuccess: '000',
            }
            for (const orderLine of order.order_lines) {
                const product = await Product.findOne({ where: { sku: orderLine.product_shop_sku } });
                if (!product) {
                    console.warn(`Not Found SKU: ${orderLine.product_shop_sku}`);
                    continue;
                }

                await OrderDetail.create({
                    id: newOrder.id,
                    numberOrder: newOrder.number,
                    productid: product.id,
                    sku: orderLine.product_shop_sku,
                    name: product.name,
                    pricepernumber: orderLine.price_unit,
                    totalprice: orderLine.total_price,
                    number: orderLine.quantity,
                    unittext: product.unittext,
                    discountamount: orderLine.price - orderLine.total_price,
                });

                console.log(`Added Order Detail SKU: ${orderLine.product_shop_sku}`);
            }
        }
        res.status(200).json({ message: "addOrderMakroProDetailFix" });

    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
})


addOrderMakro.put('/addOrderMakroPro', async (req, res) => {
    try {
        const dataMakro = await orderMakroAll();
        if (!dataMakro || !dataMakro.orders) {
            return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }
        const orders = dataMakro.orders;

        // const selectedStates = ["SHIPPIMNG"];
        // const filteredOrders = orders.filter(order => selectedStates.includes(order.order_state));

        const customersToUpdate = [];
        const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, { expiresIn: '2h' })

        for (const order of orders) {

            const existingOrder = await Order.findOne({ where: { number: order.commercial_id } }) || await OrderHis.findOne({ where: { number: order.commercial_id } });

            if (!existingOrder) {

                const createdDateUTC = order.created_date

                //test commit

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

                // ddawd

                // Format Bangkok time correctly
                const bangkokTime = new Intl.DateTimeFormat('en-GB', options).format(
                    dateObj
                )
                const [date, time] = bangkokTime.replace(',', '').split(' ')
                const [year, month, day] = date.split('/')
                const finalDate = `${day}-${month}-${year}T${time}`

                const newOrderId = await generateUniqueId();
                const newCustomerId = await generateCustomerId();
                const shipping = order.customer.shipping_address || {};
                const billing = order.customer.billing_address || {};

                let customercode = ''
                let customer = await Customer.findOne({ where: { customeriderp: order.customer.customer_id } });

                const customerEmail = order.order_additional_fields?.find(field => field.code === "customer-email")?.value || "";
                const customerTaxId = order.order_additional_fields?.find(field => field.code === "tax-id")?.value || "";
                const statusPrintInv = customerTaxId ? "TaxInvoice" : "";

                if (!customer) {
                    customer = await Customer.create({
                        customerid: newCustomerId,
                        customeriderp: order.customer.customer_id,
                        customercode: customerTaxId ? '' : "OMKP000000",
                        customername: `${billing.firstname || ""} ${billing.lastname || ""}`.trim(),
                        customeremail: customerEmail,
                        customerphone: billing?.phone || "",
                        customeraddress: `${billing.street_1 || ""} ${billing.street_2 || ""} ${billing.city || ""} ${billing.state || ""} ${billing.zip_code || ""}`.trim(),
                        customerpostcode: billing?.zip_code || "",
                        customerprovince: billing?.state || "",
                        customerdistrict: billing?.city || "",
                        customersubdistrict: billing?.street_2 || "",
                        customerstreetAddress: billing?.street_1 || "",
                        customeridnumber: customerTaxId,
                        createddate: formatDate(order.created_date),
                        // createddate: order.created_date,
                    });
                } else {
                    if (!customer.customeridnumber && customerTaxId) {
                        await customer.update({ customeridnumber: customerTaxId });
                        await customer.update({ customercode: null });
                    }
                    if (!customer.customeridnumber) {
                        await customer.update({ customercode: "OMKP000000" });
                    }
                    if (customer) {
                        customercode = customer.customercode || ''
                        // newCustomerId = customer.customerid
                    }
                }

                if (customerTaxId) {
                    customersToUpdate.push({
                        orderid: newOrderId,
                        customerid: customer.customeriderp,
                        customeridnumber: customerTaxId,
                        customername: customer.customername,
                        customeraddress: customer.customeraddress,
                        customerpostcode: customer.customerpostcode,
                        shippingaddress: `${shipping.street_1 || ""} ${shipping.street_2 || ""} ${shipping.city || ""} ${shipping.state || ""} ${shipping.zip_code || ""}`.trim(),
                        shippingpostcode: shipping.zip_code || "",
                        customerphone: customer.customerphone,
                        saleschannel: 'Makro'
                    });
                }

                let shippingAddress = await ShippingAddress.create({
                    shi_customerid: newCustomerId,
                    order_id: newOrderId,
                    shippingname: `${shipping.firstname || ""} ${shipping.lastname || ""}`.trim(),
                    shippingaddress: `${shipping.street_1 || ""} ${shipping.street_2 || ""} ${shipping.city || ""} ${shipping.state || ""} ${shipping.zip_code || ""}`.trim(),
                    shippingphone: shipping.phone || "",
                    shippingpostcode: shipping.zip_code || "",
                    shippingprovince: shipping.state || "",
                    shippingdistrict: shipping.city || "",
                    shippingsubdistrict: shipping.street_2 || "",
                });


                const newOrder = await Order.create({
                    id: newOrderId,
                    number: order.commercial_id,
                    cono: 1,
                    invno: '1',
                    ordertype: '0',
                    customerid: customer ? customer.customerid : newCustomerId,
                    customeriderp: customerTaxId ? customercode : "OMKP000000",
                    status: order.order_state,
                    paymentstatus: order.references.order_reference_for_customer || '',
                    amount: order.total_price,
                    vatamount: ((order.total_price - (order.total_price / 1.07))).toFixed(2),
                    shippingamount: order.shipping_price,
                    // shippingdate: order.shipping_deadline,
                    shippingname: `${billing.firstname || ""} ${billing.lastname || ""}`.trim(),
                    shippingaddress: `${billing.street_1 || ""} ${billing.street_2 || ""} ${billing.city || ""} ${billing.state || ""} ${billing.zip_code || ""}`.trim(),
                    shippingphone: billing.phone,
                    shippingpostcode: billing.zip_code,
                    shippingprovince: billing.zip_code,
                    shippingdistrict: billing.zip_code,
                    shippingsubdistrict: billing.zip_code,
                    shippingstreetAddress: `${billing.street_1 || ""}`.trim(),
                    // orderdate: order.created_date,
                    orderdate: finalDate,
                    orderdateString: formatDate(order.created_date),
                    paymentamount: '0',
                    description: '',
                    discount: '0',
                    platformdiscount: '0',
                    sellerdiscount: '0',
                    discountamount: 0,
                    voucheramount: 0,
                    vattype: 3,
                    saleschannel: 'Makro',
                    vatpercent: 7,
                    // createdatetime: order.created_date,
                    // createdatetimeString: order.created_date,
                    // updatedatetime: order.created_date,
                    // updatedatetimeString: order.created_date,
                    createdatetime: finalDate,
                    createdatetimeString: finalDate,
                    updatedatetime: finalDate,
                    updatedatetimeString: finalDate,

                    totalproductamount: order.total_price,
                    isDeposit: '0',
                    statusprint: '000',
                    statusPrininvSuccess: '000',
                    statusprintinv: statusPrintInv,
                });

                for (const orderLine of order.order_lines) {

                    const product = await Product.findOne({ where: { sku: orderLine.product_shop_sku } });

                    if (!product) {
                        console.warn(`Not Found SKU: ${orderLine.product_shop_sku}`);
                        continue;
                    }

                    await OrderDetail.create({
                        id: newOrder.id,
                        numberOrder: newOrder.number,
                        productid: product.id,
                        sku: orderLine.product_shop_sku,
                        name: product.name,
                        pricepernumber: orderLine.price_unit,
                        totalprice: orderLine.total_price,
                        number: orderLine.quantity,
                        unittext: product.unittext,
                        discountamount: orderLine.price - orderLine.total_price,
                    });

                    console.log(`Added Order Detail SKU: ${orderLine.product_shop_sku}`);
                }

            }
        }

        if (customersToUpdate.length > 0) {
            await axios.put(process.env.API_URL + `/zort/customer/CustomerManage/updateCustomerInv?token=${token}`, {
                dataOrder: customersToUpdate,
            });
            console.log(`updateCustomerInv`);
        }

        res.status(200).json({ message: "Added Order Makro Successfully!" });

    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
});


module.exports = addOrderMakro;    