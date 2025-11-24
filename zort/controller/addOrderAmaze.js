const express = require('express');
const axios = require('axios')
const addOrderAmaze = express.Router();
const jwt = require('jsonwebtoken');

const orderAmazeAll = require('../dataZort/allOrderAmaze');
const { v4: uuidv4 } = require("uuid");

const { Order, OrderDetail, OrderHis } = require('../model/Order');
const { Customer, ShippingAddress } = require('../model/Customer');
const { Product } = require('../model/Product')


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

addOrderAmaze.put('/addOrderAmaze', async (req, res) => {
    try {

        // 1.ดึงข้อมูลจาก Amaze
        const dataAmaze = await orderAmazeAll();
        // console.log(dataAmaze);

        if (!dataAmaze || !dataAmaze.data) {
            return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }

        const orders = dataAmaze.data;

        // console.log(orders);
        // const selectedStates = ["SHIPPING"];
        // const filteredOrders = orders.filter(order => selectedStates.includes(order.order_state));

        const customersToUpdate = [];
        const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, { expiresIn: '2h' })

        for (const order of orders) {

            // 2.ตรวจสอบข้อมูล
            const existingOrder = await Order.findOne({ where: { number: order.order_number } }) || await OrderHis.findOne({ where: { number: order.order_number } });

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
                let customer = await Customer.findOne({ where: { customeriderp: order.customer_id } });

                const customerEmail = order.billing_address?.email || "" ;
                const customerTaxId = order.billing_address?.tax_id || "" ;
                const statusPrintInv = customerTaxId ? "TaxInvoice" : "" ;

                if (!customer) {
                    customer = await Customer.create({
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
                    totalproductamount:  order.order_packages[0].sub_total,
                    isDeposit: '0',
                    statusprint: '000',
                    statusPrininvSuccess: '000',
                    statusprintinv: statusPrintInv,
                });

                for (const orderPackage of order.order_packages) {
                    for(const orderLine of orderPackage.order_items){
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


        // test update customer inv
        if (customersToUpdate.length > 0) {
            await axios.put(process.env.API_URL + `/zort/customer/CustomerManage/updateCustomerInv?token=${token}`, {
                dataOrder: customersToUpdate,
            });
            console.log(`updateCustomerInv: => `,customersToUpdate);
        }

        res.status(200).json({ message: "Added Order Amaze Successfully!" });

    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
});


module.exports = addOrderAmaze;    