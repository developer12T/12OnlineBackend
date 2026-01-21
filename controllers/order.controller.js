const { getAccessToken } = require('../services/oauth.service')
const axios = require('axios')
const orderModel = require('../model/order')
const customerModel = require('../model/customer')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')
const receiptWaitTab = require('../zort/subController/ReceiptWaitTab')
const receiptSuccessTab = require('../zort/subController/ReceiptSuccessTab')
const M3WaitTab = require('../zort/subController/M3WaitTab')
const M3SuccessTab = require('../zort/subController/M3SuccessTab')
const CancelledTab = require('../zort/subController/CancelledTab')
const InvReprint = require('../zort/subController/InvReprint')
const { Customer, OOHEAD, ItemM3 } = require('../model/master')
const { OrderZort } = require('../zort/model/Order')
const { Op } = require('sequelize')
const ExcelJS = require('exceljs')
const moment = require('moment')

const mapProductWithM3 = require('../utils/mapProductWithM3')

const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const printer = require('pdf-to-printer')
const { v4: uuidv4 } = require('uuid')
const unzipper = require('unzipper')
const { PDFDocument } = require('pdf-lib')
const makroPdfStore = new Map()
const PDF_TTL = 10 * 60 * 1000 // 10 นาที

exports.updateInvoiceAndCo = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)

    // 1) ดึง Order จาก MSSQL (Zort)
    const zortOrders = await OrderZort.findAll({
      where: {
        status: { [Op.ne]: 'Voided' },
        updatedatetime: { [Op.gte]: '2026-01-01' }
      },
      raw: true
    })

    if (!zortOrders.length) {
      return res.json({
        message: 'No Zort orders to update',
        updated: 0
      })
    }

    // 2) เตรียม bulk update สำหรับ Mongo
    const bulkOps = []

    for (const z of zortOrders) {
      if (!z.number) continue

      bulkOps.push({
        updateOne: {
          filter: { number: String(z.number) }, // ให้ชัวร์ type ตรงกัน
          update: {
            $set: {
              invno: z.invno,
              // invoiceDate: z.invoice_date || z.invoiceDate,
              cono: z.cono,

              // --- status ที่ขอ ---
              statusM3: 'success',
              statusprint: '001',
              statusPrininvSuccess: '001'
              // updatedAt: new Date()
            }
          }
        }
      })
    }

    if (!bulkOps.length) {
      return res.json({
        message: 'No valid orders to update',
        updated: 0
      })
    }

    // 3) bulkWrite เข้า Mongo
    const result = await Order.bulkWrite(bulkOps)

    return res.json({
      message: 'Update completed',
      zortTotal: zortOrders.length,
      matched: result.matchedCount,
      modified: result.modifiedCount
    })
  } catch (error) {
    console.error('[updateInvoiceAndCo]', error)
    return res.status(500).json({
      message: 'Update failed',
      error: error.message
    })
  }
}

exports.exportOrderExcel = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)

    const { startDate, endDate } = req.query
    const dateCondition = {}

    if (startDate && endDate) {
      // ✅ แปลงเป็นเวลาไทย
      const start = new Date(`${startDate}T00:00:00+07:00`)
      const end = new Date(`${endDate}T23:59:59.999+07:00`)

      dateCondition.updatedAt = {
        $gte: start,
        $lte: end
      }
    }

    // ==========================
    // 🔹 query Order
    // ==========================

    const orders = await Order.find({
      ...dateCondition,
      status: { $nin: ['Voided', 'Cancelled'] },
      statusM3: { $eq: 'success' },
      cono: { $ne: '' },
      invno: { $ne: '' }
    }).sort({ cono: 1 })

    // ==========================
    // 🔹 Excel
    // ==========================
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Orders')

    worksheet.columns = [
      { header: 'CO', key: 'cono', width: 20 },
      { header: 'Invoice', key: 'invno', width: 20 },
      { header: 'Number', key: 'number', width: 20 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'VAT amount', key: 'vatAmount', width: 12 },
      { header: 'Ex Vat', key: 'examount', width: 12 },
      // { header: 'Discount Amount', key: 'discountamount', width: 12 },
      { header: 'Order Date', key: 'orderdate', width: 15 },
      { header: 'Order Print', key: 'updatedAt', width: 15 }
    ]

    const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100

    orders.forEach(order => {
      const amount = order?.amount || 0
      const baseAmount = round2(amount / 1.07)
      const vatAmount = round2(amount - baseAmount)
      const examount = baseAmount

      worksheet.addRow({
        cono: order.cono,
        invno: order.invno || '-',
        number: order.number || '-',
        amount: order.amount || 0,
        examount: examount,
        vatAmount: vatAmount,
        discountamount: order.discountamount || '-',
        createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm'),
        orderdate: moment(order.orderdate).format('YYYY-MM-DD HH:mm'),
        updatedAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm')
      })
    })

    worksheet.getRow(1).font = { bold: true }

    // ==========================
    // 🔹 response
    // ==========================
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orders_${startDate + '_' + endDate || 'all'}.xlsx`
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: 'Export excel failed',
      error: err.message
    })
  }
}

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

exports.updateStatusM3Success2 = async (req, res) => {
  try {
    const channel = req.headers['x-channel'] || 'uat'
    const { Order } = getModelsByChannel(channel, res, orderModel)

    // 1. ดึง order ใน Mongo ที่ยังไม่ success
    const pendingOrders = await Order.find(
      { statusM3: { $ne: 'success' } },
      { cono: 1 }
    ).lean()

    if (!pendingOrders.length) {
      return res.json({
        message: 'no pending orders',
        updated: 0
      })
    }

    const orderNos = pendingOrders
      .map(o => String(o.cono).trim())
      .filter(Boolean)

    if (!orderNos.length) {
      return res.json({
        message: 'no valid cono found',
        updated: 0
      })
    }

    // 2. เช็คว่ามีใน OOHEAD หรือไม่
    const ooheadList = await OOHEAD.findAll({
      attributes: ['OAORNO'],
      where: {
        OAORNO: orderNos
      },
      raw: true
    })

    if (!ooheadList.length) {
      return res.json({
        message: 'no orders found in OOHEAD',
        updated: 0
      })
    }

    const successOrderNos = ooheadList.map(o => String(o.OAORNO).trim())

    // 3. update Mongo
    const result = await Order.updateMany(
      {
        cono: { $in: successOrderNos },
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
      pendingInMongo: pendingOrders.length,
      foundInOOHEAD: successOrderNos.length,
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified,
      updatedOrders: successOrderNos
    })
  } catch (error) {
    console.error('updateStatusM3Success2 error:', error)
    return res.status(500).json({
      message: 'internal server error'
    })
  }
}

exports.updateItemNameM3 = async (req, res) => {
  try {
    const channel = req.headers['x-channel'] || 'uat'
    const { Order } = getModelsByChannel(channel, res, orderModel)

    // 1. ดึง order ที่ยังไม่ success
    const orders = await Order.find(
      { statusM3: { $ne: 'success' }, saleschannel: 'Makro' },
      { listProduct: 1 }
    ).lean()

    if (!orders.length) {
      return res.json({
        message: 'no pending orders',
        updated: 0
      })
    }

    // 2. รวม itemCode ทั้งหมด (unique)
    const itemCodes = [
      ...new Set(
        orders
          .flatMap(o => (Array.isArray(o.listProduct) ? o.listProduct : []))
          .map(i => i.itemCode?.split('_')[0])
          .map(v => String(v).trim())
          .filter(Boolean)
      )
    ]

    if (!itemCodes.length) {
      return res.json({
        message: 'no item codes found',
        updated: 0
      })
    }

    // 3. ดึงชื่อสินค้าจาก M3
    const itemsM3 = await ItemM3.findAll({
      attributes: ['MMITNO', 'MMFUDS', 'MMITDS'],
      where: {
        MMCONO: 410,
        MMITNO: itemCodes
      },
      raw: true
    })

    // 4. ทำ map สำหรับ lookup เร็ว ๆ
    const itemM3Map = {}
    for (const m of itemsM3) {
      const itno = String(m.MMITNO).trim()
      itemM3Map[itno] = {
        nameShort: m.MMFUDS || '', // ⭐ MMFUDS
        nameFull: m.MMITDS || '' // ⭐ MMITDS
      }
    }

    // 5. update MongoDB
    let updatedCount = 0

    for (const order of orders) {
      let changed = false

      const newListProduct = order.listProduct.map(p => {
        const code = p.itemCode?.split('_')[0]
        const m3 = itemM3Map[code]

        if (!m3) return p

        // ถ้ายังไม่มีชื่อ → update
        if (!p.nameM3 || !p.nameM3Full) {
          changed = true
          return {
            ...p,
            nameM3: m3.nameShort || '',
            nameM3Full: m3.nameFull || ''
          }
        }

        return p
      })

      if (changed) {
        await Order.updateOne(
          { _id: order._id },
          { $set: { listProduct: newListProduct } }
        )
        updatedCount++
      }
    }

    return res.json({
      message: 'update item name from M3 success',
      updated: updatedCount
    })
  } catch (error) {
    console.error('updateItemNameM3 error:', error)
    res.status(500).json({ error: error.message })
  }
}

exports.getOrder = async (req, res) => {
  try {
    const channel = req.headers['x-channel']

    const page = req.body.page
    const tab = req.body.tab

    if (page == 'receipt') {
      if (tab == 'wait-tab') {
        receiptWaitTab(res, channel, req.body).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'success-tab') {
        console.log('success-tab')
        receiptSuccessTab(res, channel, req.body).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'cancelled-tab') {
        console.log('success-tab')
        CancelledTab(res, channel, req.body).then(orders => {
          res.json(orders)
        })
      }
    } else if (page == 'preparem3') {
      if (tab == 'wait-tab') {
        M3WaitTab(res, channel, req.body).then(orders => {
          res.json(orders)
        })
      } else if (tab == 'success-tab') {
        M3SuccessTab(res, channel, req.body).then(orders => {
          res.json(orders)
        })
      }
    } else if (page == 'reprint') {
      InvReprint(res, channel, {
        startDate: req.body.startDate,
        endDate: req.body.endDate
      }).then(orders => {
        res.json(orders)
      })
    }
  } catch (error) {
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

async function generateCustomerNo () {
  const prefix = 'OMKP'

  const lastCustomer = await Customer.findOne({
    where: {
      customerNo: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['customerNo', 'DESC']], // 👈 Sequelize ใช้แบบนี้
    attributes: ['customerNo'],
    raw: true
  })

  let nextNumber = 1

  if (lastCustomer?.customerNo) {
    const lastNo = lastCustomer.customerNo.replace(prefix, '')
    nextNumber = Number(lastNo) + 1
  }

  const padded = String(nextNumber).padStart(6, '0')
  return `${prefix}${padded}`
}

function normalizeSpaces (text = '') {
  return String(text)
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // 🔥 Unicode spaces
    .replace(/\s+/g, ' ') // รวม space ปกติ
    .trim()
}

function splitShippingAddress4 (address = '') {
  const cleanText = normalizeSpaces(address)
  const chunkSize = 36

  return {
    shippingAddress1: cleanText.slice(0, chunkSize),
    shippingAddress2: cleanText.slice(chunkSize, chunkSize * 2),
    shippingAddress3: cleanText.slice(chunkSize * 2, chunkSize * 3),
    shippingAddress4: cleanText.slice(chunkSize * 3, chunkSize * 4)
  }
}

async function findCustomerByTaxNo (taxno) {
  if (!taxno) return null

  return Customer.findOne({
    where: { taxno },
    attributes: ['customerNo', 'taxno'],
    raw: true
  })
}

async function insertCustomerToErp (orderData) {
  console.log(orderData)
  const customerTaxId = orderData.order_additional_fields?.find(
    f => f.code === 'tax-id'
  )?.value

  const taxno = typeof customerTaxId === 'string' ? customerTaxId.trim() : ''

  // 1️⃣ เช็คว่ามีลูกค้าอยู่แล้วหรือยัง
  // const existingCustomer = await findCustomerByTaxNo(taxno)

  // if (existingCustomer) {
  //   console.log(`[ERP] Customer already exists ${existingCustomer.customerNo}`)
  //   return existingCustomer.customerNo
  // }

  const billing = orderData.customer.billing_address || {}

  // 2️⃣ ยังไม่มี → generate ใหม่
  const customerNo = await generateCustomerNo()

  const shippingAddress = [
    billing?.street_1,
    billing?.street_2,
    billing?.city,
    billing?.state,
    billing?.zip_code
  ]
    .filter(v => typeof v === 'string' && v.trim())
    .join(' ')
  const {
    shippingAddress1,
    shippingAddress2,
    shippingAddress3,
    shippingAddress4
  } = splitShippingAddress4(shippingAddress)

  const customername = `${billing.firstname || ''} ${
    billing.lastname || ''
  }`.trim()

  const payload = {
    Hcase: 1,
    customerNo,
    customerStatus: '20',
    customerName: customername,
    customerChannel: '107',
    customerCoType: '071',
    customerAddress1: shippingAddress1,
    customerAddress2: shippingAddress2,
    customerAddress3: shippingAddress3,
    customerAddress4: '',
    customerPoscode: billing?.zip_code || '',
    customerPhone: billing?.phone || '',
    warehouse: '107',
    OKSDST: 'ON',
    saleTeam: 'ON0',
    OKCFC1: 'ON101',
    OKCFC3: 'R',
    OKCFC6: '071',
    salePayer: 'O00000001',
    creditLimit: orderData.creditlimit || '0',
    taxno,
    saleCode: '11002',
    saleZone: 'ON',
    shippings: [
      {
        shippingAddress1,
        shippingAddress2,
        shippingAddress3,
        shippingAddress4: '',
        shippingPoscode: billing?.zip_code ?? '',
        shippingPhone: billing?.phone ?? '',
        shippingRoute: billing?.zip_code ?? '',
        OPGEOX: orderData.lat || '0.0',
        OPGEOY: orderData.long || '0.0'
      }
    ]
  }

  await axios.post(`${process.env.API_URL_12ERP}/customer/insert`, payload, {
    timeout: 15000
  })

  console.log(`[ERP] Customer inserted ${customerNo}`)
  return customerNo
}

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
      let customercodeNew

      if (customerTaxId) {
        const customerNo = await insertCustomerToErp(order)
        console.log(`[ERP] Customer created ${customerNo}`)
        customercodeNew = customerNo
      }

      let customer = await Customer.findOne({
        where: { customeriderp: order.customer.customer_id }
      })

      if (!customer) {
        customer = await Customer.create({
          // customerid: order,
          customeriderp: order.customer.customer_id,
          customercode: customercodeNew ? customercodeNew : 'OMKP000000',
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
      // const listProduct = []

      // ================================
      // 5. listProduct (map + M3)
      // ================================
      const listProduct = await mapProductWithM3(order.order_lines, ItemM3)

      // for (const line of order.order_lines) {
      //   const [code, suffix] = line.product_shop_sku.split('_')
      //   listProduct.push({
      //     itemNumber: line.line_number || 1,
      //     // id: order.order_id,
      //     productid: line.offer_id,
      //     procode: line.procode || '',
      //     sku: line.product_shop_sku,
      //     itemCode: code || '',
      //     unit: suffix || '',
      //     name: line.product_title,
      //     quantity: line.quantity,
      //     discount: 0,
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

exports.addOrderAmaze = async (req, res) => {
  try {
    const channel = 'uat'

    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    const loginResponse = await axios.post(
      process.env.urlAmaze + '/open-console/api/v1/client/login',
      {
        input: process.env.amazeUsername || '0991197810',
        password: process.env.amazePassword || 'Default123@'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )

    if (
      !loginResponse.data.succeeded ||
      !loginResponse.data.data.access_token
    ) {
      throw new Error('Login failed: ' + JSON.stringify(loginResponse.data))
    }

    const accessToken = loginResponse.data.data.access_token
    console.log('Login successful, token obtained')
    console.log('accessToken', accessToken)

    // 2. ใช้ access_token เรียก order API
    const orderResponse = await axios.get(
      process.env.urlAmaze +
        '/open-console/api/v2/client/order?status=ready_to_ship',
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    const orders = orderResponse.data

    if (!orders.length) {
      return res.status(200).json({ message: 'No orders to sync' })
    }

    for (const order of orders) {
      // 2.ตรวจสอบข้อมูล
      const existingOrder = await Order.findOne({
        where: { number: order.order_number }
      })

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

        // const newOrderId = await generateUniqueId()
        // const newCustomerId = await generateCustomerId()

        const shipping = order.order_address || {}
        const billing = order.billing_address || {}

        let customercode = ''
        let customer = await Customer.findOne({
          where: { customeriderp: order.customer_id }
        })

        const customerEmail = order.billing_address?.email || ''
        const customerTaxId = order.billing_address?.tax_id || ''
        const statusPrintInv = customerTaxId ? 'TaxInvoice' : ''

        if (!customer) {
          customer = await Customer.create({
            customerid: newCustomerId,
            customeriderp: order.customer_id,
            customercode: customerTaxId ? '' : 'OAMZ000000',
            customername: order.customer_name,
            customeremail: customerEmail,
            customerphone: order.billing_address?.phoneno || '',
            customeraddress: `${order.billing_address?.address || ''} ${
              order.billing_address?.district || ''
            } ${order.billing_address?.sub_district || ''} ${
              order.billing_address?.province || ''
            } ${order.billing_address?.postcode || ''}`.trim(),
            customerpostcode: order.billing_address?.postcode || '',
            customerprovince: order.billing_address?.province || '',
            customerdistrict: order.billing_address?.district || '',
            customersubdistrict: order.billing_address?.sub_district || '',
            customerstreetAddress: order.billing_address?.address || '',
            customeridnumber: customerTaxId,
            createddate: formatDate(order.created_at)
          })
        } else {
          if (!customer.customeridnumber && customerTaxId) {
            await customer.update({ customeridnumber: customerTaxId })
            await customer.update({ customercode: null })
          }
          if (!customer.customeridnumber) {
            await customer.update({ customercode: 'OAMZ000000' })
          }
          if (customer) {
            customercode = customer.customercode || ''
          }
        }
        if (customerTaxId) {
          customersToUpdate.push({
            // orderid: newOrderId,
            customerid: order.customer_id,
            customeridnumber: customerTaxId,
            customername: order.billing_address?.name || order.customer_name,
            customeraddress: `${order.billing_address?.address || ''} ${
              order.billing_address?.district || ''
            } ${order.billing_address?.sub_district || ''} ${
              order.billing_address?.province || ''
            } ${order.billing_address?.postcode || ''}`.trim(),
            customerpostcode: order.billing_address?.postcode || '',
            shippingaddress: `${order.billing_address?.address || ''} ${
              order.billing_address?.district || ''
            } ${order.billing_address?.sub_district || ''} ${
              order.billing_address?.province || ''
            } ${order.billing_address?.postcode || ''}`.trim(),
            shippingpostcode: order.billing_address?.postcode || '',
            customerphone: order.billing_address?.phoneno || '',
            saleschannel: 'Amaze'
          })
        }

        // test add shipping address
        let shippingAddress = await ShippingAddress.create({
          shi_customerid: customer ? customer.customerid : newCustomerId,
          // order_id: newOrderId,
          shippingname: order.billing_address?.name || order.customer_name,
          shippingaddress: `${order.order_address?.address_name || ''} ${
            order.order_address?.district_name || ''
          } ${order.order_address?.ward_name || ''} ${
            order.order_address?.city_name || ''
          } ${order.order_address?.postcode || ''}`.trim(),
          shippingphone: order.order_address?.phoneno || '',
          shippingpostcode: order.order_address?.postcode || '',
          shippingprovince: order.order_address?.city_name || '',
          shippingdistrict: order.order_address?.district || '',
          shippingsubdistrict: order.order_address?.ward_name || ''
        })

        // test add order
        const newOrder = await Order.create({
          // id: newOrderId,
          number: order.order_number,
          cono: '',
          invno: '',
          // ordertype: '0',
          customerid: customer ? customer.customerid : newCustomerId,
          customeriderp: customerTaxId ? customercode : 'OAMZ000000',
          status:
            order.order_packages[0].status === 'cancelled'
              ? 'Voided'
              : order.order_packages[0].status === 'ready_to_ship'
              ? 'SHIPPING'
              : order.order_packages[0].status,
          paymentstatus:
            order.order_packages[0].status === 'cancelled'
              ? 'Voided'
              : order.order_packages[0].status === 'ready_to_ship'
              ? 'paid'
              : order.order_packages[0].status,
          amount: order.order_packages[0].grand_total,
          vatamount: (
            order.order_packages[0].grand_total -
            order.order_packages[0].grand_total / 1.07
          ).toFixed(2),
          shippingamount: order.order_packages[0].shipping_amount,
          shippingname: order.billing_address?.name || '',
          shippingaddress: `${order.order_address?.address_name || ''} ${
            order.order_address?.district_name || ''
          } ${order.order_address?.ward_name || ''} ${
            order.order_address?.city_name || ''
          } ${order.order_address?.postcode || ''}`.trim(),
          shippingphone: order.order_address?.phoneno || '',
          shippingpostcode: order.order_address?.postcode || '',
          shippingprovince: order.order_address?.province || '',
          shippingdistrict: order.order_address?.district || '',
          shippingsubdistrict: order.order_address?.ward_name || '',
          shippingstreetAddress: order.order_address?.address || '',
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
          statusprintinv: statusPrintInv
        })

        // for (const orderPackage of order.order_packages) {
        //   for (const orderLine of orderPackage.order_items) {
        //     // const product = await Product.findOne({
        //     //   where: { sku: orderLine.sku }
        //     // })
        //     // console.log('orderLine', orderLine);
        //     if (!product) {
        //       console.warn(`Not Found SKU: ${orderLine.sku}`)
        //       continue
        //     }
        //     // test add order detail
        //     await OrderDetail.create({
        //       id: newOrder.id,
        //       numberOrder: newOrder.number,
        //       productid: product.id,
        //       sku: orderLine.sku,
        //       name: product.name,
        //       pricepernumber: orderLine.unit_price,
        //       totalprice: orderLine.grand_total,
        //       number: orderLine.quantity_ordered,
        //       unittext: product.unittext,
        //       discountamount: orderLine.sub_total - orderLine.grand_total
        //     })

        //     console.log(`Added Order Detail SKU: ${orderLine.sku}`)
        //   }
        // }
      }
    }
  } catch (error) {}
}

exports.streamMakroPdf = (req, res) => {
  const { token } = req.params
  const record = makroPdfStore.get(token)

  if (!record) {
    return res.status(404).json({ message: 'PDF expired or not found' })
  }

  // เช็ค TTL
  if (Date.now() - record.createdAt > PDF_TTL) {
    try {
      if (fs.existsSync(record.path)) {
        fs.unlinkSync(record.path)
      }
    } catch (e) {}

    makroPdfStore.delete(token)
    return res.status(410).json({ message: 'PDF expired' })
  }

  if (!fs.existsSync(record.path)) {
    makroPdfStore.delete(token)
    return res.status(404).json({ message: 'PDF not found' })
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename="MAKRO_DELIVERY.pdf"')

  fs.createReadStream(record.path).pipe(res)
}

const cleanupMakroPdfStore = () => {
  const now = Date.now()

  for (const [token, record] of makroPdfStore.entries()) {
    if (now - record.createdAt > PDF_TTL) {
      try {
        if (fs.existsSync(record.path)) {
          fs.unlinkSync(record.path)
        }
      } catch (e) {}

      makroPdfStore.delete(token)
    }
  }
}

exports.printDeliveyMackro = async (req, res) => {
  try {
    /**
     * body:
     * {
     *   "orderIds": ["MAKROPRO14782193B-A", "MAKROPRO28414732B-A"]
     * }
     */
    const { orderIds } = req.body

    const token = uuidv4()

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'orderIds is required' })
    }

    // ===============================
    // 1️⃣ Temp paths
    // ===============================
    const tempRoot = path.join(
      process.env.TEMP || 'C:/Temp',
      `makro-doc-${uuidv4()}`
    )
    const zipPath = path.join(tempRoot, 'documents.zip')
    const extractPath = path.join(tempRoot, 'pdfs')

    fs.mkdirSync(extractPath, { recursive: true })

    // ===============================
    // 2️⃣ Download ZIP (STREAM)
    // ===============================
    const downloadUrl = `${
      process.env.urlMakro
    }/api/orders/documents/download?order_ids=${orderIds.join(',')}`

    const response = await axios.get(downloadUrl, {
      responseType: 'stream',
      headers: {
        Accept: 'application/octet-stream',
        Authorization: process.env.frontKeyMakro
      }
    })

    await new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(zipPath))
        .on('finish', resolve)
        .on('error', reject)
    })

    // ===============================
    // 3️⃣ Extract ZIP
    // ===============================
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise()

    // ===============================
    // 4️⃣ Map PDF ต่อ order
    // ===============================
    const filesByOrder = {}
    const pdfListForMerge = []
    const notFound = []

    for (const orderId of orderIds) {
      const pdfPath = getSecondPdfPathByOrder(extractPath, orderId)

      if (!pdfPath) {
        notFound.push(orderId)
        continue
      }

      filesByOrder[orderId] = `file:///${pdfPath.replace(/\\/g, '/')}`
      pdfListForMerge.push(pdfPath)
    }

    if (pdfListForMerge.length === 0) {
      return res.status(404).json({ message: 'No PDF files found' })
    }

    // ===============================
    // 5️⃣ Merge PDF
    // ===============================
    const mergedPdf = await PDFDocument.create()

    for (const pdfPath of pdfListForMerge) {
      const bytes = fs.readFileSync(pdfPath)
      const pdf = await PDFDocument.load(bytes)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(p => mergedPdf.addPage(p))
    }

    const mergedPath = path.join(extractPath, `MAKRO_MERGED_${Date.now()}.pdf`)

    const mergedBytes = await mergedPdf.save()
    fs.writeFileSync(mergedPath, mergedBytes)

    // ===============================
    // 6️⃣ Response to frontend
    // ===============================

    cleanupMakroPdfStore()

    makroPdfStore.set(token, {
      path: mergedPath,
      createdAt: Date.now()
    })

    // res.json({
    //   success: true,
    //   files: filesByOrder, // 👈 PDF แยกต่อ order
    //   mergedFile: `file:///${mergedPath.replace(/\\/g, '/')}`,
    //   notFound
    // })

    res.json({
      success: true,
      pdfUrl: `/online/api/order/makro/pdf/${token}`,
      totalOrders: pdfListForMerge.length,
      notFound
    })
  } catch (error) {
    console.error('[printDeliveyMackro]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const getSecondPdfPathByOrder = (extractRoot, orderId) => {
  const orderDir = path.join(extractRoot, orderId)
  if (!fs.existsSync(orderDir)) return null

  const candidates = fs
    .readdirSync(orderDir)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .filter(f => !f.toLowerCase().includes('delivery'))
    .map(f => ({
      name: f,
      fullPath: path.join(orderDir, f),
      size: fs.statSync(path.join(orderDir, f)).size
    }))
    .sort((a, b) => b.size - a.size)

  return candidates[0]?.fullPath || null
}
