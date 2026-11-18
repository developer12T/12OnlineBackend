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

const xlsx = require('xlsx')

const {
  getNextRunningFromOOHEAD
} = require('../services/runningNumber.service')
const { env } = require('process')

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

      dateCondition.createdAt = {
        $gte: start,
        $lte: end
      }
    }

    // ==========================
    // 🔹 query Order
    // ==========================

    const orders = await Order.find({
      ...dateCondition,
      // status: { $nin: ['Voided', 'Cancelled'] },
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
      `${process.env.M3API_URL}/online/api/M3API/StockManage/Stock/getStockCount`
    )
    let countStockM3 = StockM3.data[0].stockerp

    let inv = await axios.post(
      `${process.env.M3API_URL}/online/api/M3API/OrderManage/Order/getInvNumber`,
      { ordertype: '071' },
      {}
    )
    let invM3 = inv.data[0].customerordno

    let cono = await axios.post(
      `${process.env.M3API_URL}/online/api/M3API/OrderManage/Order/getNumberSeries`,
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
      `${process.env.M3API_URL}/online/api/M3API/OrderManage/order/getCustomerInv`,
      {
        customertype: '107',
        customercode: 'OSPE'
      },
      {}
    )
    let OSPENO = OSPE.data[0].customercode

    let OLAZ = await axios.post(
      `${process.env.M3API_URL}/online/api/M3API/OrderManage/order/getCustomerInv`,
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

// สถานะออเดอร์ Amaze ที่จะดึงเข้าระบบ
// (ready_to_ship อยู่ได้ไม่กี่ชั่วโมง เลยดึง waiting_confirm_received ด้วยกันตกหล่น)
const AMAZE_SYNC_STATUSES = ['ready_to_ship', 'waiting_confirm_received']

async function fetchAmazeOrders (accessToken, status) {
  const orders = []
  let page = 1
  let totalItems = 0

  do {
    const res = await axios.get(
      `${process.env.urlAmaze}/open-console/api/v2/client/order`,
      {
        params: { status, page },
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    const data = res.data?.data || []
    totalItems = res.data?.total_items || 0
    orders.push(...data)
    if (!data.length) break
    page++
  } while (orders.length < totalItems)

  return orders
}

exports.addOrderAmaze = async (req, res) => {
  try {
    const channel = 'uat'
    const dryRun = req.query.dryRun === '1' || req.body?.dryRun === true

    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    // ================================
    // 1. Login + ดึง order จาก Amaze
    // ================================
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

    const accessToken = loginResponse.data?.data?.access_token
    if (!loginResponse.data?.succeeded || !accessToken) {
      throw new Error('Amaze login failed')
    }

    const allOrders = []
    for (const status of AMAZE_SYNC_STATUSES) {
      allOrders.push(...(await fetchAmazeOrders(accessToken, status)))
    }

    if (!allOrders.length) {
      return res.status(200).json({ message: 'No orders to sync' })
    }

    const imported = []

    // ================================
    // 2. Loop order
    // ================================
    for (const order of allOrders) {
      const number = order.amaze_order_id || order.order_number
      const exists = await Order.findOne({ number })
      if (exists) continue

      const billing = order.billing_address || {}
      const address = order.order_address || {}
      const packages = order.order_packages || []

      // ================================
      // 3. Customer
      // ================================
      const customerTaxId = billing.tax_id || ''
      const customerName = billing.name || order.customer_name || ''
      const billingAddress = `${billing.address || ''} ${
        billing.sub_district || ''
      } ${billing.district || ''} ${billing.province || ''} ${
        billing.postcode || ''
      }`.trim()

      let customer = await Customer.findOne({
        customeriderp: String(order.customer_id)
      })

      if (!dryRun) {
        if (!customer) {
          customer = await Customer.create({
            customeriderp: String(order.customer_id),
            customercode: customerTaxId ? '' : 'OAMZ000000',
            customername: customerName,
            customeremail: billing.email || '',
            customerphone: billing.phoneno || '',
            customeraddress: billingAddress,
            customerpostcode: billing.postcode || '',
            customerprovince: billing.province || '',
            customerdistrict: billing.district || '',
            customersubdistrict: billing.sub_district || '',
            customerstreetAddress: billing.address || '',
            customeridnumber: customerTaxId
          })
        } else if (customerTaxId && !customer.customeridnumber) {
          customer.customeridnumber = customerTaxId
          customer.customercode = ''
          await customer.save()
        }
      }

      const customerCode = customer
        ? customer.customercode || ''
        : customerTaxId
        ? ''
        : 'OAMZ000000'

      // ================================
      // 4. listProduct (map + M3)
      // ================================
      const orderLines = packages.flatMap(p => p.order_items || [])
      const listProduct = await mapProductWithM3(
        orderLines.map((line, idx) => ({
          line_number: idx + 1,
          offer_id: line.product_id,
          product_shop_sku: line.seller_sku || line.sku,
          product_title: line.product_info?.name || line.name || '',
          quantity: line.quantity_ordered,
          price_unit: line.unit_price,
          total_price: line.sub_total
        })),
        ItemM3
      )

      // ราคาก่อนลด (original_unit_price) → pricePerUnitOri
      listProduct.forEach((item, idx) => {
        const line = orderLines[idx]
        const ori = Number(line.original_unit_price ?? line.unit_price) || 0
        const qty = Number(line.quantity_ordered) || 0
        item.pricePerUnitOri = ori
        item.discount = Math.max(0, (ori - Number(line.unit_price || 0)) * qty)
      })

      // ค่าขนส่ง (เหมือนช่องทางอื่นใน webhook.service)
      const shippingAmount = packages.reduce(
        (sum, p) => sum + (Number(p.shipping_amount) || 0),
        0
      )
      if (shippingAmount > 0) {
        listProduct.push({
          itemNumber: listProduct.length + 1,
          productid: '9999999',
          procode: '',
          sku: 'ZNS1401001_JOB',
          itemCode: 'ZNS1401001_JOB',
          unit: 'JOB',
          name: 'ค่าขนส่ง',
          quantity: 1,
          discount: 0,
          discountChanel: '',
          pricePerUnitOri: shippingAmount,
          pricePerUnit: shippingAmount,
          totalprice: shippingAmount
        })
      }

      const amount = listProduct.reduce(
        (sum, item) => sum + (Number(item.totalprice) || 0),
        0
      )

      const createdAt = order.order_date || order.created_at

      const newOrder = {
        id: order.id,
        number,
        cono: '',
        invno: '',
        ordertype: '0',

        customerid: String(order.customer_id),
        customername: customer?.customername || customerName,
        customercode: customerCode,
        customeridnumber: customerTaxId,

        status: 'Success',
        paymentstatus: 'Paid',

        amount,
        vatamount: Number((amount - amount / 1.07).toFixed(2)),
        totalproductamount: amount,

        shippingamount: shippingAmount,
        shippingname: address.contact_name || customerName,
        shippingaddress: `${address.address_name || ''} ${
          address.ward_name || ''
        } ${address.district_name || ''} ${address.city_name || ''} ${
          address.postcode || ''
        }`.trim(),
        shippingphone: address.contact_phone_number || '',
        shippingpostcode: address.postcode || '',
        shippingprovince: address.city_name || '',
        shippingdistrict: address.district_name || '',
        shippingsubdistrict: address.ward_name || '',
        shippingstreetAddress: address.address_name || '',

        orderdate: createdAt,
        orderdateString: createdAt,

        saleschannel: 'Amaze',
        vatpercent: 7,
        vattype: 3,

        statusprint: '000',
        statusprintinv: customerTaxId ? 'TaxInvoice' : '',
        statusPrininvSuccess: '000',

        createdatetime: createdAt,
        createdatetimeString: createdAt,
        updatedatetime: order.updated_at || createdAt,
        updatedatetimeString: order.updated_at || createdAt,

        listProduct
      }

      if (!dryRun) {
        await Order.create(newOrder)
        console.log(`✔ Imported Amaze Order: ${number}`)
      }
      imported.push(dryRun ? newOrder : number)
    }

    res.status(200).json({
      message: dryRun
        ? 'Dry run (ไม่ได้บันทึก)'
        : 'Added Order Amaze Successfully!',
      total: allOrders.length,
      imported
    })
  } catch (error) {
    console.error('[addOrderAmaze]', error.response?.data || error.message)
    res.status(500).json({ message: 'Internal server error' })
  }
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

exports.updateInvFromExcel = async (req, res) => {
  function excelSerialToISO (serial) {
    if (!serial) return null

    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(excelEpoch.getTime() + serial * 86400000)

    return date.toISOString()
  }

  function excelSerialWithNowTime (serial) {
    const base = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(base.getTime() + serial * 86400000)

    const now = new Date()

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
      )
    ).toISOString()
  }

  try {
    const channel = req.headers['x-channel']
    const { Order } = getModelsByChannel(channel, res, orderModel)

    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' })
    }

    // 1️⃣ read excel from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = xlsx.utils.sheet_to_json(sheet)

    if (!rows.length) {
      return res.status(400).json({ message: 'Excel is empty' })
    }

    const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100

    const ops = rows
      .filter(r => r.Invo && r.amount)
      .map(r => ({
        updateOne: {
          filter: {
            invno: String(r.Invo)
          },
          update: {
            $set: {
              amount: round2(r.amount)
            }
          }
        }
      }))

    // res.json({
    //   message: 'Excel processed successfully',
    //   totalRows: rows
    // })

    if (!ops.length) {
      return res.status(400).json({ message: 'No valid rows to update' })
    }

    // 3️⃣ execute bulk update
    const result = await Order.bulkWrite(ops, { ordered: false })

    res.json({
      message: 'Excel processed successfully',
      totalRows: rows.length,
      matched: result.matchedCount,
      modified: result.modifiedCount
    })
  } catch (error) {
    console.error('[updateInvFromExcel]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

function getThaiYear () {
  return (new Date().getFullYear() + 543).toString()
}

exports.updateInvoNumber = async (req, res) => {
  try {
    const fix = '171'
    const startCono = '1267104415'

    const channel = 'uat'
    const { Order } = getModelsByChannel(channel, null, orderModel)

    const year = getThaiYear()
    const prefix = `${year}${fix}`

    /* ===============================
     * 1) หา invno ที่ซ้ำ
     * =============================== */
    const dupInvnos = await Order.aggregate([
      {
        $match: {
          invno: { $regex: `^${prefix}` }
        }
      },
      {
        $group: {
          _id: '$invno',
          count: { $sum: 1 },
          ids: { $push: '$id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ])

    if (!dupInvnos.length) {
      console.log('✅ No duplicate invno found')
      return
    }

    const dupIds = dupInvnos.flatMap(d => d.ids)

    /* ===============================
     * 2) ดึงเฉพาะ order ที่ต้องแก้
     * =============================== */
    const orders = await Order.find(
      {
        id: { $in: dupIds },
        cono: { $gte: startCono } // ⭐ เงื่อนไขสำคัญ
      },
      { id: 1, invno: 1, cono: 1 }
    )
      .lean()
      .sort({ cono: 1 }) // ⭐ เรียงตาม cono

    if (!orders.length) {
      console.log('ℹ️ No orders to fix after cono', startCono)
      return
    }

    /* ===============================
     * 3) หา invno เริ่มต้น
     * =============================== */

    /* ===============================
     * 3) กำหนด invno เริ่มต้น (manual)
     * =============================== */
    const startInvno = '2569171003956'

    // safety check กันพลาด
    if (!startInvno.startsWith(prefix)) {
      throw new Error(
        `startInvno ${startInvno} does not match prefix ${prefix}`
      )
    }

    let running = parseInt(startInvno.slice(prefix.length), 10)
    // const firstInvno = await getNextRunningFromOOHEAD(fix)

    // let running = parseInt(firstInvno.slice(prefix.length), 10)

    /* ===============================
     * 4) เตรียม bulk update
     * =============================== */
    const bulkOps = []

    for (const order of orders) {
      const newInvno = `${prefix}${String(running).padStart(6, '0')}`
      running++

      bulkOps.push({
        updateOne: {
          filter: { id: order.id },
          update: {
            $set: {
              invno: newInvno
            }
            // $currentDate: { updatedAt: true }
          }
        }
      })

      // debug log (แนะนำให้เปิดตอนรันครั้งแรก)
      console.log(
        `FIX invno | cono=${order.cono} | ${order.invno} → ${newInvno}`
      )
    }

    /* ===============================
     * 5) bulk write
     * =============================== */
    if (bulkOps.length) {
      await Order.bulkWrite(bulkOps)
    }

    console.log(`✅ Fixed ${bulkOps.length} orders (start cono ${startCono})`)

    res.json({
      message: 'updateInvoNumber successfully',
      totalRows: bulkOps.length,
      startCono: startCono
    })
  } catch (error) {
    console.error('[updateInvoNumber]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ==========================
// 🔹 SAP Sales Order Import (ใช้ template จาก SAP)
// ==========================
const SAP_TEMPLATE_PATH = path.join(
  __dirname,
  '../template/sap_sales_order_template.xlsx'
)
const SAP_HEADER_DEFAULT = {
  salesOrderType: 'Z203',
  salesOrganization: '2000',
  distributionChannel: '70',
  division: '00',
  soldToParty: '1000000041',
  plant: '2026',
  storageLocation: 'O001'
}
const SAP_FIRST_DATA_ROW = 6
// ค่าขนส่งส่งเป็นรายการสินค้าแยก → แปลงรหัส M3 เป็นรหัสสินค้าใน SAP
const SAP_SHIPPING_SKU = 'ZNS1401001'
const SAP_SHIPPING_ITEM = {
  product: 'ZNS1401001', // TODO: เปลี่ยนเป็นรหัสสินค้าค่าขนส่งใน SAP
  unit: 'JOB'
}

exports.exportSapSalesOrder = async (req, res) => {
  try {
    const orders = Array.isArray(req.body.orders) ? req.body.orders : []
    if (!orders.length) {
      return res.status(400).json({ message: 'orders is required' })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(SAP_TEMPLATE_PATH)
    const worksheet = workbook.getWorksheet('Order Data')

    // เก็บ style แถวตัวอย่างไว้ แล้วล้างข้อมูลตัวอย่างทิ้ง
    const styleRow = worksheet.getRow(SAP_FIRST_DATA_ROW)
    const colStyles = {}
    styleRow.eachCell({ includeEmpty: true }, (cell, col) => {
      colStyles[col] = cell.style
    })
    for (let r = SAP_FIRST_DATA_ROW; r <= worksheet.rowCount; r++) {
      worksheet.getRow(r).eachCell({ includeEmpty: true }, cell => {
        cell.value = null
      })
    }

    const str = v => (v === undefined || v === null ? '' : String(v))
    const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100
    const toSapDate = d => (d ? moment(d).format('YYYYMMDD') : '')

    let rowIndex = SAP_FIRST_DATA_ROW
    let itemNo = 0

    orders.forEach((order, orderIdx) => {
      const tempId = String(orderIdx + 1).padStart(10, '0')
      const docDate = toSapDate(
        order.printdatetimeString || order.printdate || order.orderdate
      )
      const items = order.item || []

      // DISONLINE = ส่วนลดท้ายบิล → ใส่เป็น Online Discount ที่ header
      const onlineDiscount = items
        .filter(it => it.sku === 'DISONLINE')
        .reduce((sum, it) => sum + Math.abs(Number(it.totalprice) || 0), 0)

      const itemPrice = it =>
        Number(it.pricepernumberOri ?? it.pricepernumber) || 0

      items
        .filter(it => it.sku !== 'DISONLINE')
        // ค่าขนส่ง 0 บาท ไม่ต้องส่ง
        .filter(it => !(it.sku === SAP_SHIPPING_SKU && itemPrice(it) === 0))
        .forEach(it => {
          itemNo++
          const isShipping = it.sku === SAP_SHIPPING_SKU
          const qty = Number(it.number) || 0
          const price = itemPrice(it)
          const discountPerUnit =
            qty > 0 ? round2((Number(it.discount) || 0) / qty) : 0
          const unit = isShipping ? SAP_SHIPPING_ITEM.unit : str(it.unit)

          const values = {
            B: tempId,
            C: SAP_HEADER_DEFAULT.salesOrderType,
            D: SAP_HEADER_DEFAULT.salesOrganization,
            E: SAP_HEADER_DEFAULT.distributionChannel,
            F: SAP_HEADER_DEFAULT.division,
            G: SAP_HEADER_DEFAULT.soldToParty,
            H: '',
            I: str(order.number),
            J: docDate,
            K: docDate,
            L: onlineDiscount ? round2(onlineDiscount) : '',
            M: String(itemNo),
            N: isShipping ? SAP_SHIPPING_ITEM.product : str(it.sku),
            O: '',
            P: price === 0 ? 'CBXN' : '',
            Q: qty,
            R: unit,
            S: String(price),
            T: '1',
            U: unit,
            V: discountPerUnit ? String(discountPerUnit) : '',
            W: discountPerUnit ? '1' : '',
            X: discountPerUnit ? unit : '',
            Y: SAP_HEADER_DEFAULT.plant,
            Z: SAP_HEADER_DEFAULT.storageLocation,
            AA: ''
          }

          const row = worksheet.getRow(rowIndex++)
          Object.entries(values).forEach(([col, value]) => {
            const cell = row.getCell(col)
            if (colStyles[cell.col]) cell.style = colStyles[cell.col]
            if (value !== '') cell.value = value
          })
          row.commit()
        })
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=SAP_Sales_Order_${moment().format(
        'YYYYMMDD_HHmm'
      )}.xlsx`
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error('[exportSapSalesOrder]', err)
    res.status(500).json({
      message: 'Export SAP excel failed',
      error: err.message
    })
  }
}

exports.exportOrderStockExcel = async (req, res) => {
  try {
    const channel = 'uat'
    const { Order } = getModelsByChannel(channel, res, orderModel)
    let { orderIds } = req.body

    /* ==========================
     * Validate
     * ========================== */
    if (!Array.isArray(orderIds) || !orderIds.length) {
      return res.status(400).json({ message: 'orderIds is required' })
    }

    // กันยิงมั่ว + duplicate
    orderIds = [...new Set(orderIds)].slice(0, 500)

    /* ==========================
     * Query orders
     * ========================== */
    const orders = await Order.find({
      id: { $in: orderIds }
    })
      .select({ listProduct: 1 })
      .lean()

    // res.json({
    //   message: 'exportOrderStockExcel successfully',
    //   order: orders
    //   // startCono: startCono
    // })

    /* ==========================
     * Process summary
     * ========================== */
    const unitMapping = {
      CTN: 'large',
      BAG: 'medium',
      PAC: 'medium',
      CRT: 'medium',
      PCS: 'small',
      BOT: 'small'
    }

    const grouped = {}

    for (const order of orders) {
      for (const p of order.listProduct || []) {
        const itemCode = p.sku?.split('_')[0]
        const unitItem = p.sku?.split('_')[1]

        if (!itemCode) continue
        if (itemCode.startsWith('ZNS') || itemCode.startsWith('DIS')) continue

        if (!grouped[itemCode]) {
          grouped[itemCode] = {
            id: itemCode,
            name: p.nameM3Full,
            large: 0,
            medium: 0,
            small: 0
          }
        }

        const unit = unitMapping[unitItem] || 'small'
        grouped[itemCode][unit] += Number(p.quantity || 0)
      }
    }

    const summary = Object.values(grouped).sort((a, b) =>
      a.id.localeCompare(b.id)
    )

    /* ==========================
     * Response headers
     * ========================== */
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="summary_order.xlsx"'
    )

    /* ==========================
     * Excel (STREAM)
     * ========================== */
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res
    })

    const sheet = workbook.addWorksheet('Summary')

    sheet.columns = [
      { header: 'รหัสสินค้า', key: 'id', width: 20 },
      { header: 'รายการ', key: 'name', width: 40 },
      { header: 'หีบ', key: 'large', width: 10 },
      { header: 'แพ็ค', key: 'medium', width: 10 },
      { header: 'ชิ้น', key: 'small', width: 10 }
    ]

    let total = { large: 0, medium: 0, small: 0 }

    for (const r of summary) {
      sheet.addRow(r).commit()
      total.large += r.large
      total.medium += r.medium
      total.small += r.small
    }

    sheet
      .addRow({
        id: 'รวมทั้งหมด',
        large: total.large,
        medium: total.medium,
        small: total.small
      })
      .commit()

    sheet.commit()
    await workbook.commit()

    // stream จะ end ให้อัตโนมัติ
  } catch (err) {
    console.error('[exportOrderStockExcel]', err)
    res.status(500).json({ message: 'Export failed' })
  }
}
