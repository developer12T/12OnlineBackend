const { getAccessToken } = require('../services/oauth.service')
const axios = require('axios')
const orderDataMakro = require('../zort/dataZort/allOrderMakro')
const orderModel = require('../model/order')
const customerModel = require('../model/customer')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')
const generateUniqueId = require('../middleware/order')
const InvReprint = require('../zort/subController/InvReprint')
const receiptWaitTab = require('../zort/subController/ReceiptWaitTab')
const receiptSuccessTab = require('../zort/subController/ReceiptSuccessTab')
const ReceiptWaitTabPayment = require('../zort/subController/ReceiptWaitTabPayment')
const AllOrderTab = require('../zort/subController/AllOrderTab')
const invtWaitTab = require('../zort/subController/InvWaitTab')
const invSuccessTab = require('../zort/subController/InvSuccessTab')
const M3WaitTab = require('../zort/subController/M3WaitTab')
const M3SuccessTab = require('../zort/subController/M3SuccessTab')

exports.updateStatusM3Success = async (req, res) => {
  try {
    const channel = req.headers['x-channel'] || 'uat'
    const { Order } = getModelsByChannel(channel, res, orderModel)

    const { successfulOrders } = req.body

    if (!Array.isArray(successfulOrders) || successfulOrders.length === 0) {
      return res.status(400).json({
        message: 'successfulOrders is required and must be an array'
      })
    }

    // ดึง orderNo ออกมา (อ้างอิง cono)
    const orderNos = successfulOrders
      .map(o => String(o.orderNo).trim())
      .filter(Boolean)

    if (!orderNos.length) {
      return res.status(400).json({
        message: 'orderNo not found in successfulOrders'
      })
    }

    // update เฉพาะที่ยังไม่ success (กันอัปเดตซ้ำ)
    const result = await Order.updateMany(
      {
        cono: { $in: orderNos },
        statusM3: { $ne: 'success' }
      },
      {
        $set: {
          statusM3: 'success'
        },
        $currentDate: {
          updatedAt: true
        }
      }
    )

    return res.json({
      message: 'update statusM3 success',
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'internal server error'
    })
  }
}

exports.getOrder = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    // console.log("Customer",Customer)

    var page = req.body.page
    var tab = req.body.tab

    if (page == 'receipt') {
      if (tab == 'wait-tab') {
        receiptWaitTab(res, channel).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'success-tab') {
        console.log('success-tab')
        receiptSuccessTab(res, channel).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'payment-tab') {
        ReceiptWaitTabPayment(res, channel).then(orders => {
          res.json(orders)
        })
      }
    } else if (page == 'all') {
      AllOrderTab(res, channel).then(orders => {
        res.json(orders)
      })
      // const data = await Order.findAll()
      // res.json(data)
    } else if (page == 'inv') {
      if (tab == 'wait-tab') {
        invtWaitTab(res, channel).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'success-tab') {
        invSuccessTab(res, channel).then(orders => {
          res.json(orders)
        })
      }
    } else if (page == 'preparem3') {
      if (tab == 'wait-tab') {
        M3WaitTab(res, channel).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'success-tab') {
        M3SuccessTab(res, channel).then(orders => {
          res.json(orders)
        })
      }
    } else if (page == 'reprint') {
      // รับพารามิเตอร์วันที่จาก request body
      const { startDate, endDate } = req.body
      const dateFilter = { startDate, endDate }
      InvReprint(res, channel, dateFilter).then(orders => {
        res.json(orders)
      })
    }

    // res.status(200).json({
    //   status:200,
    //   message:'getOrder successful'
    // })
  } catch (error) {
    // res.status(500).json('invalid data')
    console.log(error)
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

exports.getDashboardData = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)
    const { Product } = getModelsByChannel(channel, res, productModel)

    const orders = await Order.find()
    const grouped = orders.reduce((acc, order) => {
      // parse string format dd/MM/yyyy
      const [year, month, day] = order.updatedatetime.split(' ')[0].split('-')
      const yearInt = parseInt(year, 10)

      if (!acc[yearInt]) {
        acc[yearInt] = {
          yearOrder: yearInt,
          countMakro: 0,
          countShopee: 0,
          countLazada: 0,
          countAmaze: 0,
          countTiktok: 0
        }
      }

      if (order.saleschannel === 'Makro') acc[yearInt].countMakro++
      if (order.saleschannel === 'Shopee') acc[yearInt].countShopee++
      if (order.saleschannel === 'Lazada') acc[yearInt].countLazada++
      if (order.saleschannel === 'Amaze') acc[yearInt].countAmaze++
      if (order.saleschannel === 'TIKTOK') acc[yearInt].countTiktok++

      return acc
    }, {})
    const result = Object.values(grouped).sort(
      (a, b) => a.yearOrder - b.yearOrder
    )

    const countOrderAll = await Order.countDocuments({
      status: { $ne: 'Voided' }
    })
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
    let StockM3 = await axios.post(
      'http://192.168.2.97:8383/M3API/StockManage/Stock/getStockCount'
    )
    let countStockM3 = StockM3.data[0].stockerp

    let inv = await axios.post(
      'http://192.168.2.97:8383/M3API/OrderManage/Order/getInvNumber',
      { ordertype: '071' },
      {}
    )
    let invM3 = inv.data[0].customerordno

    let cono = await axios.post(
      'http://192.168.2.97:8383/M3API/OrderManage/Order/getNumberSeries',
      {
        series: 'ง',
        seriestype: '01',
        companycode: 410,
        seriesname: '0'
      },
      {}
    )
    let conoM3 = cono.data[0].lastno

    let OSPE = await axios.post(
      'http://192.168.2.97:8383/M3API/OrderManage/order/getCustomerInv',
      {
        customertype: '107',
        customercode: 'OSPE'
      },
      {}
    )
    let OSPENO = OSPE.data[0].customercode

    let OLAZ = await axios.post(
      'http://192.168.2.97:8383/M3API/OrderManage/order/getCustomerInv',
      {
        customertype: '107',
        customercode: 'OLAZ'
      },
      {}
    )
    let OLAZNO = OLAZ.data[0].customercode

    const invZort = await Order.findOne(
      {},
      { invno: 1, invM3: 1, _id: 0 }
    ).sort({ invno: -1 })

    const topInvno = invZort?.invno

    const invzort = parseInt(invZort?.invno, 10)
    const invm3c = parseInt(invZort?.invM3, 10)

    if (invm3c > invzort) {
      var lastInvThrust = invM3
    } else {
      var lastInvThrust = topInvno
    }

    res.json([
      {
        CountByYear: result,
        CountOrderAll: countOrderAll,
        OrderCountShopee: countOrderShopee,
        OrderCountLazada: countOrderLazada,
        CountOrderWaitPrint: countOrderWaitPrint,
        CountOrderSuccessPrint: countOrderAll - countOrderWaitPrint,
        StockZort: StockZort,
        WarStock: StockZortout,
        StockM3: countStockM3,
        InvLastno: lastInvThrust,
        conoLastno: conoM3,
        cuscodeOspeLastno: OSPENO,
        cuscodeOlazLastno: OLAZNO
      }
    ])
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}

const formatDate = isoDate => {
  return isoDate ? new Date(isoDate).toISOString().split('T')[0] : null
}

// const generateUniqueId = async () => {
//   let uniqueId
//   let exists

//   do {
//     uniqueId = parseInt(uuidv4().replace(/\D/g, '').slice(0, 9), 10)

//     if (uniqueId > 2147483647) {
//       uniqueId = (uniqueId % 2000000000) + 100000000
//     }

//     exists =
//       (await Order.findOne({ where: { id: uniqueId } })) ||
//       (await OrderHis.findOne({ where: { id: uniqueId } }))
//   } while (exists)

//   return uniqueId
// }

exports.addOrderMakroPro = async (req, res) => {
  try {
    const channel = 'uat'

    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    // ================================
    // 1. ดึง order จาก Makro (pagination)
    // ================================
    const firstRes = await axios.get(
      `${process.env.urlMakro}/api/orders?order_state_codes=SHIPPING&max=100&offset=0&order=asc`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: process.env.frontKeyMakro
        }
      }
    )

    let allOrders = [...firstRes.data.orders]
    const totalCount = firstRes.data.total_count
    const maxLoop = Math.ceil(totalCount / 100)

    for (let i = 1; i < maxLoop; i++) {
      const offset = i * 100
      const resPage = await axios.get(
        `${process.env.urlMakro}/api/orders?order_state_codes=SHIPPING&max=100&offset=${offset}&order=asc`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: process.env.frontKeyMakro
          }
        }
      )
      allOrders.push(...resPage.data.orders)
    }

    if (!allOrders.length) {
      return res.status(200).json({ message: 'No orders to sync' })
    }

    const customersToUpdate = []

    // ================================
    // 2. Loop order
    // ================================
    for (const order of allOrders) {
      const exists = await Order.findOne({ number: order.commercial_id })

      if (exists) continue

      // ================================
      // 3. เวลาไทย
      // ================================
      const dateObj = new Date(order.created_date)
      const bangkokTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(dateObj)

      const [d, t] = bangkokTime.replace(',', '').split(' ')
      const [day, month, year] = d.split('/')
      const finalDate = `${day}-${month}-${year}T${t}`

      // const newOrderId = String(await generateUniqueId())
      // const newCustomerId = await generateCustomerId()

      const shipping = order.customer.shipping_address || {}
      const billing = order.customer.billing_address || {}

      // ================================
      // 4. Customer
      // ================================
      const customerEmail =
        order.order_additional_fields?.find(f => f.code === 'customer-email')
          ?.value || ''

      const customerTaxId =
        order.order_additional_fields?.find(f => f.code === 'tax-id')?.value ||
        ''

      const statusPrintInv = customerTaxId ? 'TaxInvoice' : ''

      let customer = await Customer.findOne({
        where: { customeriderp: order.customer.customer_id }
      })

      if (!customer) {
        customer = await Customer.create({
          // customerid: order,
          customeriderp: order.customer.customer_id,
          customercode: customerTaxId ? '' : 'OMKP000000',
          customername: `${billing.firstname || ''} ${
            billing.lastname || ''
          }`.trim(),
          customeremail: customerEmail,
          customerphone: billing.phone || '',
          customeraddress: `${billing.street_1 || ''} ${
            billing.street_2 || ''
          } ${billing.city || ''} ${billing.state || ''} ${
            billing.zip_code || ''
          }`.trim(),
          customeridnumber: customerTaxId,
          createddate: formatDate(order.created_date)
        })
      } else {
        if (!customer.customeridnumber && customerTaxId) {
          await customer.update({
            customeridnumber: customerTaxId,
            customercode: null
          })
        }
        if (!customer.customeridnumber) {
          await customer.update({ customercode: 'OMKP000000' })
        }
      }

      if (customerTaxId) {
        customersToUpdate.push({
          orderid: order.order_id,
          customerid: customer.customeriderp,
          customeridnumber: customerTaxId,
          customername: customer.customername,
          customeraddress: customer.customeraddress,
          shippingaddress: `${shipping.street_1 || ''} ${
            shipping.street_2 || ''
          } ${shipping.city || ''} ${shipping.state || ''} ${
            shipping.zip_code || ''
          }`.trim(),
          saleschannel: 'Makro'
        })
      }

      // ================================
      // 5. listProduct (แทน OrderDetail)
      // ================================
      const listProduct = []

      // for (const line of order.order_lines) {
      //   const product = await Product.findOne({
      //     where: { sku: line.product_shop_sku }
      //   })

      //   if (!product) {
      //     console.warn(`SKU not found: ${line.product_shop_sku}`)
      //     continue
      //   }

      //   listProduct.push({
      //     itemNumber: line.line_number || 1,
      //     id: Number(newOrderId),
      //     productid: String(product.id),
      //     procode: product.procode || '',
      //     sku: line.product_shop_sku,
      //     itemCode: product.itemcode || '',
      //     unit: product.unittext || '',
      //     name: product.name,
      //     quantity: line.quantity,
      //     discount: line.price - line.total_price || 0,
      //     discountChanel: '',
      //     pricePerUnitOri: line.price_unit,
      //     pricePerUnit: line.price_unit,
      //     totalprice: line.total_price
      //   })
      // }

      // ================================
      // 6. Create Order (Mongo)
      // ================================
      await Order.create({
        id: order.order_id,
        number: order.commercial_id,
        cono: '',
        invno: '',
        ordertype: '0',

        customerid: order.customer.customer_id,
        customername: customer.customername,
        customercode: customer.customercode,
        customeridnumber: customerTaxId,

        status: order.order_state,
        paymentstatus: order.references.order_reference_for_customer || '',

        amount: order.total_price,
        vatamount: Number(
          (order.total_price - order.total_price / 1.07).toFixed(2)
        ),
        totalproductamount: order.total_price,

        shippingamount: order.shipping_price,
        shippingname: `${billing.firstname || ''} ${
          billing.lastname || ''
        }`.trim(),
        shippingaddress: `${billing.street_1 || ''} ${billing.street_2 || ''} ${
          billing.city || ''
        } ${billing.state || ''} ${billing.zip_code || ''}`.trim(),
        shippingphone: billing.phone,
        shippingpostcode: billing.zip_code,
        shippingprovince: billing.state,
        shippingdistrict: billing.city,
        shippingsubdistrict: billing.street_2,
        shippingstreetAddress: billing.street_1,

        orderdate: order.created_date,
        orderdateString: order.created_date,

        saleschannel: 'Makro',
        vatpercent: 7,
        vattype: 3,

        statusprint: '000',
        statusprintinv: statusPrintInv,
        statusPrininvSuccess: '000',

        createdatetime: order.created_date,
        createdatetimeString: order.created_date,
        updatedatetime: order.created_date,
        updatedatetimeString: order.created_date,

        listProduct
      })

      console.log(`✔ Imported Makro Order: ${order.commercial_id}`)
    }

    res.status(200).json({
      message: 'Added Order Makro Successfully!',
      total: allOrders.length
    })
  } catch (error) {
    console.error('[addOrderMakroPro]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
