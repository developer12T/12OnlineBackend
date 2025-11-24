const express = require('express');
const moment = require('moment');
const { Op, where } = require('sequelize');
const axios = require('axios')
const addOrderMakro = express.Router();
const jwt = require('jsonwebtoken');
const pm2 = require('pm2')
const orderDataMakro = require('../dataZort/allOrderMakro');
const { v4: uuidv4 } = require("uuid");

const { Order, OrderDetail, OrderHis } = require('../model/Order');
const { Customer, ShippingAddress } = require('../model/Customer');
const { orderMovement } = require('../model/Ordermovement');
const { Product } = require('../model/Product')
const { logTable } = require('../model/Logtable')

const { sequelize } = require('../config/database');

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

const formatDate = (isoDate) => {
  return isoDate ? new Date(isoDate).toISOString().split("T")[0] : null;
};


addOrderMakro.put('/addOrderMakroPro', async (req, res) => {
  try {

    const dataMakro = await orderDataMakro();
    if (!dataMakro || !dataMakro.orders) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    const orders = dataMakro.orders;
    for (const order of orders) {

      const existingOrder = await Order.findOne({ where: { number: order.commercial_id } }) || await OrderHis.findOne({ where: { number: order.commercial_id } });

      if (!existingOrder) {


        const newOrderId = await generateUniqueId();
        const shipping = order.customer.shipping_address || {};
        const billing = order.customer.billing_address || {};

        let customer = await Customer.findOne({ where: { customeriderp: order.customer.customer_id } });
        const customerEmail = order.order_additional_fields?.find(field => field.code === "customer-email")?.value || "";
        const customerTaxId = order.order_additional_fields?.find(field => field.code === "tax-id")?.value || "";
        const statusPrintInv = customerTaxId ? "TaxInvoice" : "";

        if (!customer) {
          customer = await Customer.create({
            customeriderp: order.customer.customer_id,
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
          });
        } else if (!customer.customeridnumber && customerTaxId) {
          await customer.update({ customeridnumber: customerTaxId });
          console.log(`✅ อัปเดต tax-id ให้ลูกค้า ID: ${customer.customerid} → ${customerTaxId}`);
        }

        let shippingAddress = await ShippingAddress.create({
          shi_customerid: customer.customerid,
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
          customerid: order.customer.customer_id,
          customeriderp: 'OMKP000000',
          status: order.order_state,
          paymentstatus: order.payment_workflow,
          amount: order.total_price,
          vatamount: (order.total_price / 1.07).toFixed(2),
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
          orderdate: order.created_date,
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
          createdatetime: order.created_date,
          createdatetimeString: order.created_date,
          updatedatetime: order.created_date,
          updatedatetimeString: order.created_date,
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

    res.status(200).json({ message: "Added Order Makro Successfully!" });

  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }

});



module.exports = addOrderMakro;    