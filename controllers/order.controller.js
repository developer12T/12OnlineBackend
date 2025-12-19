const { getAccessToken } = require('../services/oauth.service')
const axios = require('axios')
const orderDataMakro = require('../zort/dataZort/allOrderMakro');
const orderModel = require('../model/order')
const customerModel = require('../model/customer')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')
const generateUniqueId = require('../middleware/order');
const InvReprint = require('../zort/subController/InvReprint');
const receiptWaitTab = require('../zort/subController/ReceiptWaitTab');
const receiptSuccessTab = require('../zort/subController/receiptSuccessTab');
const ReceiptWaitTabPayment = require('../zort/subController/ReceiptWaitTabPayment');
exports.getOrder = async (req, res) => {
  try {

    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    console.log("Customer",Customer)

    var page = req.body.page;
    var tab = req.body.tab;



    if (page == 'receipt') {
      if (tab == 'wait-tab') {
        receiptWaitTab(res,channel).then(orders => { res.json(orders); })
      } else if (tab == 'success-tab') {
        receiptSuccessTab(res,channel).then(orders => { res.json(orders); })
      } else if (tab == 'payment-tab') {
        ReceiptWaitTabPayment(res,channel).then(orders => { res.json(orders) })
      }
    } else if (page == 'all') {
      AllOrderTab(res).then(orders => { res.json(orders); })
      // const data = await Order.findAll()
      // res.json(data)
    } else if (page == 'inv') {
      if (tab == 'wait-tab') {
        invtWaitTab(res).then(orders => { res.json(orders); })
      } else if (tab == 'success-tab') {
        invSuccessTab(res).then(orders => { res.json(orders); })
      }
    } else if (page == 'preparem3') {
      if (tab == 'wait-tab') {
        M3WaitTab(res).then(orders => { res.json(orders); })
      } else if (tab == 'success-tab') {
        M3SuccessTab(res).then(orders => { res.json(orders); })
      }
    } else if (page == 'reprint') {
      // รับพารามิเตอร์วันที่จาก request body
      const { startDate, endDate } = req.body;
      const dateFilter = { startDate, endDate };

      InvReprint(res, dateFilter).then(orders => { res.json(orders); })
    }

    // res.status(200).json({
    //   status:200,
    //   message:'getOrder successful'
    // })

  } catch (error) {
    res.status(500).json('invalid data')
    console.log(error);
  }

}

exports.getOrderBento = async (req, res) => {
  try {
    const { action, langs, limit, date_created_start, date_created_end } =
      req.query
    const token = await getAccessToken()

    const response = await axios.get(
      `${process.env.BENTO_ORDER_URL}/order/list/${process.env.CLIENT_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          action,
          langs,
          limit,
          date_created_start,
          date_created_end
        }
      }
    )

    res.json(response.data)
    // res.json("TEST")
  } catch (err) {
    console.error('Error get order:', err.response?.data || err.message)
    res.status(500).json({ message: 'Failed to get order' })
  }
}

exports.insert = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    const dataMakro = await orderDataMakro();
    if (!dataMakro || !dataMakro.orders) {
      return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
    }

    const orders = dataMakro.orders;
    for (const order of orders) {

      const existingOrder = await Order.findOne({ where: { number: order.commercial_id } });

      if (!existingOrder) {

        const newOrderId = await generateUniqueId(channel);
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
          }
          );
        } else if (!customer.customeridnumber && customerTaxId) {
          //       await customer.update({ customeridnumber: customerTaxId });
          //       console.log(`✅ อัปเดต tax-id ให้ลูกค้า ID: ${customer.customerid} → ${customerTaxId}`);
          //     }

          let shippingAddress = await ShippingAddress.create({
            //       shi_customerid: customer.customerid,
            //       order_id: newOrderId,
            //       shippingname: `${shipping.firstname || ""} ${shipping.lastname || ""}`.trim(),
            //       shippingaddress: `${shipping.street_1 || ""} ${shipping.street_2 || ""} ${shipping.city || ""} ${shipping.state || ""} ${shipping.zip_code || ""}`.trim(),
            //       shippingphone: shipping.phone || "",
            //       shippingpostcode: shipping.zip_code || "",
            //       shippingprovince: shipping.state || "",
            //       shippingdistrict: shipping.city || "",
            //       shippingsubdistrict: shipping.street_2 || "",
          });

          //     const newOrder = await Order.create({
          //       id: newOrderId,
          //       number: order.commercial_id,
          //       cono: 1,
          //       invno: '1',
          //       ordertype: '0',
          //       customerid: order.customer.customer_id,
          //       customeriderp: 'OMKP000000',
          //       status: order.order_state,
          //       paymentstatus: order.payment_workflow,
          //       amount: order.total_price,
          //       vatamount: (order.total_price / 1.07).toFixed(2),
          //       shippingamount: order.shipping_price,
          //       // shippingdate: order.shipping_deadline,
          //       shippingname: `${billing.firstname || ""} ${billing.lastname || ""}`.trim(),
          //       shippingaddress: `${billing.street_1 || ""} ${billing.street_2 || ""} ${billing.city || ""} ${billing.state || ""} ${billing.zip_code || ""}`.trim(),
          //       shippingphone: billing.phone,
          //       shippingpostcode: billing.zip_code,
          //       shippingprovince: billing.zip_code,
          //       shippingdistrict: billing.zip_code,
          //       shippingsubdistrict: billing.zip_code,
          //       shippingstreetAddress: `${billing.street_1 || ""}`.trim(),
          //       orderdate: order.created_date,
          //       orderdateString: formatDate(order.created_date),
          //       paymentamount: '0',
          //       description: '',
          //       discount: '0',
          //       platformdiscount: '0',
          //       sellerdiscount: '0',
          //       discountamount: 0,
          //       voucheramount: 0,
          //       vattype: 3,
          //       saleschannel: 'Makro',
          //       vatpercent: 7,
          //       createdatetime: order.created_date,
          //       createdatetimeString: order.created_date,
          //       updatedatetime: order.created_date,
          //       updatedatetimeString: order.created_date,
          //       totalproductamount: order.total_price,
          //       isDeposit: '0',
          //       statusprint: '000',
          //       statusPrininvSuccess: '000',
          //       statusprintinv: statusPrintInv,
          //     });

          //     for (const orderLine of order.order_lines) {

          //       const product = await Product.findOne({ where: { sku: orderLine.product_shop_sku } });

          //       if (!product) {
          //         console.warn(`Not Found SKU: ${orderLine.product_shop_sku}`);
          //         continue;
          //       }

          //       await OrderDetail.create({
          //         id: newOrder.id,
          //         numberOrder: newOrder.number,
          //         productid: product.id,
          //         sku: orderLine.product_shop_sku,
          //         name: product.name,
          //         pricepernumber: orderLine.price_unit,
          //         totalprice: orderLine.total_price,
          //         number: orderLine.quantity,
          //         unittext: product.unittext,
          //         discountamount: orderLine.price - orderLine.total_price,
          //       });

          //       console.log(`Added Order Detail SKU: ${orderLine.product_shop_sku}`);
        }

      }
    }

    res.status(200).json({
      status: 201,
      message: "Added Order Makro Successfully!",
      data: dataMakro
    });




  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}

exports.removeOrder = async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      message: 'Successful!',
      data: 'TEST Success'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}


exports.getData = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)
    const { Product } = getModelsByChannel(channel, res, productModel)

    const orders = await Order.find()
    const grouped = orders.reduce((acc, order) => {
      // parse string format dd/MM/yyyy
      const [year, month, day] = order.updatedatetime.split(' ')[0].split('-');
      const yearInt = parseInt(year, 10);

      if (!acc[yearInt]) {
        acc[yearInt] = {
          yearOrder: yearInt,
          countMakro: 0,
          countShopee: 0,
          countLazada: 0,
          countAmaze: 0,
          countTiktok: 0,
        };
      }

      if (order.saleschannel === 'Makro') acc[yearInt].countMakro++;
      if (order.saleschannel === 'Shopee') acc[yearInt].countShopee++;
      if (order.saleschannel === 'Lazada') acc[yearInt].countLazada++;
      if (order.saleschannel === 'Amaze') acc[yearInt].countAmaze++;
      if (order.saleschannel === 'TIKTOK') acc[yearInt].countTiktok++;

      return acc;
    }, {});
    const result = Object.values(grouped).sort((a, b) => a.yearOrder - b.yearOrder);

    const countOrderAll = await Order.countDocuments({ status: { $ne: 'Voided' } })
    const countOrderShopee = await Order.countDocuments({
      saleschannel: 'Shopee',
      status: { $ne: 'Voided' }
    })
    const countOrderLazada = await Order.countDocuments({
      saleschannel: 'Lazada',
      status: { $ne: 'Voided' }
    })

    const countOrderWaitPrint = await Order.countDocuments({
      statusprint: '000',
      statusPrininvSuccess: '000',
      status: { $ne: 'Voided' }
    })

    const StockZort = await Product.find()

    const StockZortout = await Product.countDocuments({ stock: 0 })
    let StockM3 = await axios.post('http://192.168.2.97:8383/M3API/StockManage/Stock/getStockCount');
    let countStockM3 = (StockM3.data[0].stockerp);

    let inv = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getInvNumber', { ordertype: '071' }, {});
    let invM3 = (inv.data[0].customerordno);

    let cono = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries', {
      series: "ง",
      seriestype: "01",
      companycode: 410,
      seriesname: "0"
    }, {});
    let conoM3 = (cono.data[0].lastno);

    let OSPE = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/order/getCustomerInv', {
      customertype: "107",
      customercode: "OSPE",
    }, {});
    let OSPENO = (OSPE.data[0].customercode);

    let OLAZ = await axios.post('http://192.168.2.97:8383/M3API/OrderManage/order/getCustomerInv', {
      customertype: "107",
      customercode: "OLAZ",
    }, {});
    let OLAZNO = (OLAZ.data[0].customercode);

    const invZort = await Order
      .findOne({}, { invno: 1, invM3: 1, _id: 0 })
      .sort({ invno: -1 })

    const topInvno = invZort?.invno

    const invzort = parseInt(invZort?.invno, 10)
    const invm3c = parseInt(invZort?.invM3, 10)

    if (invm3c > invzort) {
      var lastInvThrust = invM3
    } else {
      var lastInvThrust = topInvno
    }

    res.json([{
      'CountByYear': result,
      'CountOrderAll': countOrderAll,
      'OrderCountShopee': countOrderShopee,
      'OrderCountLazada': countOrderLazada,
      'CountOrderWaitPrint': countOrderWaitPrint,
      'CountOrderSuccessPrint': countOrderAll - countOrderWaitPrint,
      'StockZort': StockZort,
      'WarStock': StockZortout,
      'StockM3': countStockM3,
      'InvLastno': lastInvThrust,
      'conoLastno': conoM3,
      'cuscodeOspeLastno': OSPENO,
      'cuscodeOlazLastno': OLAZNO,


    }])

  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}