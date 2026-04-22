const orderModel = require('../model/order')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')
const { Customer, ItemM3 } = require('../model/master')
const axios = require('axios')
const { Op } = require('sequelize')

function getCustomerPrefix (channel) {
  switch (channel) {
    case 'Shopee':
      return 'OSPE'
    case 'Lazada':
      return 'OLAZ'
    case 'TIKTOK':
      return 'OTIK'
    default:
      throw new Error(`Unsupported channel: ${channel}`)
  }
}

async function generateCustomerNo (channel) {
  const prefix = getCustomerPrefix(channel)

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

function splitShippingAddress4 (address = '') {
  const text = String(address).trim()
  const chunkSize = 36

  return {
    shippingAddress1: text.substring(0, chunkSize) || '',
    shippingAddress2: text.substring(chunkSize, chunkSize * 2) || '',
    shippingAddress3: text.substring(chunkSize * 2, chunkSize * 3) || '',
    shippingAddress4: text.substring(chunkSize * 3, chunkSize * 4) || ''
  }
}

function isRoundingMismatch (item) {
  const qty = Number(item.quantity || 0)
  const unit = Number(item.pricePerUnitOri || 0)
  const total = Number(item.totalprice || 0)

  if (!qty || !unit) return false

  const calc = Math.round(unit * qty * 100) / 100
  return calc !== Math.round(total * 100) / 100
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
  const taxno = orderData.customeridnumber?.trim()
  if (!taxno) return null

  // // 1️⃣ เช็คว่ามีลูกค้าอยู่แล้วหรือยัง
  // const existingCustomer = await findCustomerByTaxNo(taxno)

  // if (existingCustomer) {
  //   console.log(`[ERP] Customer already exists ${existingCustomer.customerNo}`)
  //   return existingCustomer.customerNo
  // }

  // 2️⃣ ยังไม่มี → generate ใหม่
  const customerNo = await generateCustomerNo(orderData.saleschannel)

  const {
    shippingAddress1,
    shippingAddress2,
    shippingAddress3,
    shippingAddress4
  } = splitShippingAddress4(orderData.shippingaddress)

  const payload = {
    Hcase: 1,
    customerNo,
    customerStatus: '20',
    customerName: orderData.customername,
    customerChannel: '107',
    customerCoType: '071',
    customerAddress1: shippingAddress1,
    customerAddress2: shippingAddress2,
    customerAddress3: shippingAddress3,
    customerAddress4: '',
    customerPoscode: orderData.shippingpostcode,
    customerPhone: orderData.shippingphone,
    warehouse: '108',
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
        shippingPoscode: orderData.shippingpostcode,
        shippingPhone: orderData.shippingphone,
        shippingRoute: orderData.shippingpostcode,
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

function splitMoney (total, parts) {
  const totalCents = Math.round(total * 100)

  const base = Math.floor(totalCents / parts)
  const remainder = totalCents - base * parts

  const result = Array(parts).fill(base)

  for (let i = 0; i < remainder; i++) {
    result[i] += 1
  }

  return result.map(c => c / 100)
}

function splitItemGrouped (item) {
  const qty = Number(item.quantity)
  const total = Number(item.totalprice)
  const discount = Number(item.discount || 0)

  if (!qty || !total) return [item]

  // 1️⃣ split price ต่อชิ้น
  const unitPrices = splitMoney(total, qty)

  // 2️⃣ split discount ต่อชิ้น
  const discountParts = splitMoney(discount, qty)

  // 3️⃣ group ตาม price
  const map = new Map()

  unitPrices.forEach((price, i) => {
    const key = price.toFixed(2)

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        quantity: 0,
        pricePerUnitOri: price,
        pricePerUnit: price,
        totalprice: 0,
        discount: 0
      })
    }

    const row = map.get(key)
    row.quantity += 1
    row.totalprice += price
    row.discount += discountParts[i]
  })

  // 4️⃣ fix floating precision
  return Array.from(map.values()).map(r => ({
    ...r,
    totalprice: Math.round(r.totalprice * 100) / 100,
    discount: Math.round(r.discount * 100) / 100
  }))
}

function resequenceItemNumber (list) {
  return list.map((item, index) => ({
    ...item,
    itemNumber: index + 1
  }))
}

exports.handleOrderPaid = async data => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  // if (!data || data.paymentstatus !== 'Paid') return

  const orderId = String(data.id)
  const orderNumber = data.number
  if (!orderId || !orderNumber) {
    throw new Error('Invalid webhook payload')
  }

  let order = await Order.findOne({ id: orderId })

  if (order && order.paymentstatus === 'Paid') {
    console.log(`[Webhook] Order ${orderNumber} already paid → skip processing`)
    return
  }

  if (data.customeridnumber) {
    const customerNo = await insertCustomerToErp(data)
    console.log(`[ERP] Customer created ${customerNo} (${data.saleschannel})`)
    data.customercode = customerNo
  }

  // ดึง itemCode หลัก (suffix[0])
  // ดึง itemCode หลัก (suffix[0]) + trim + unique
  const itemCodes = [
    ...new Set(
      (Array.isArray(order?.listProduct) ? order.listProduct : data.list)
        .map(i => i.itemCode?.split('_')[0])
        .map(v => String(v).trim())
        .filter(v => v !== '')
    )
  ]

  const itemsM3 = await ItemM3.findAll({
    attributes: ['MMITNO', 'MMFUDS', 'MMITDS'],
    where: {
      MMCONO: 410,
      // MMCONO: 410,
      MMITNO: itemCodes
    },
    raw: true
  })

  const itemM3Map = {}

  for (const m of itemsM3) {
    const itno = String(m.MMITNO).trim()

    itemM3Map[itno] = {
      nameFull: m.MMFUDS, // ชื่อย่อ
      nameShort: m.MMITDS // ชื่อเต็ม
    }
  }

  console.log(itemM3Map)
  // ================================
  // BASE listProduct (ใช้เหมือนกัน)
  // ================================
  const baseList = Array.isArray(order?.listProduct)
    ? [...order.listProduct]
    : Array.isArray(data.list)
    ? data.list.map(item => {
        const itemNo = item.itemCode?.split('_')[0]
        const unit = item.itemCode?.split('_')[1]
        const m3 = itemM3Map[itemNo] || {}

        return {
          itemNumber: item.itemNumber,
          id: Number(orderId),
          productid: item.productid,
          procode: item.proCode || '',
          sku: item.sku,
          itemCode: item.itemCode,
          unit: unit,
          name: item.name,

          // ⭐ จาก M3
          nameM3: m3.nameShort || '', // MMFUDS
          nameM3Full: m3.nameFull || '', // MMITDS

          quantity: item.quantity,
          discount: item.discount || 0,
          discountChanel: item.discountChanel || '',
          pricePerUnitOri: item.pricePerUnitOri ?? item.pricePerUnit,
          pricePerUnit: item.pricePerUnit,
          totalprice: item.totalprice
        }
      })
    : []

  let listProduct = [...baseList]

  // ================================
  // ADJUST SELLER DISCOUNT FOR FREE / PREMIUM
  // ================================
  let sellerDiscount = Number(data.sellerdiscount ?? 0)

  for (const item of listProduct) {
    if (!item?.sku) continue

    const parts = item.sku.split('_').filter(Boolean)
    const skuSuffix = parts.at(-1) // Free / Premium

    if (skuSuffix === 'Free' || skuSuffix === 'Premium') {
      const oriPrice = Number(item.pricePerUnitOri ?? 0)

      if (oriPrice > 0) {
        sellerDiscount -= oriPrice
      }
    }
  }

  //
  // ป้องกันติดลบ
  if (sellerDiscount < 0) sellerDiscount = 0

  // เขียนค่ากลับ (ใช้ค่าที่ถูกปรับแล้ว)
  data.sellerdiscount = sellerDiscount

  // ================================
  // NORMALIZE PACK FOR ERP (FIXED)
  // ================================
  for (const item of listProduct) {
    const multiplier = Number(item?.sku?.split?.('_')?.[2]) || 1
    if (multiplier <= 1) continue

    const qtyPack = Number(item.quantity || 0) // 👈 จำนวนแพ็คจริง
    const total = Number(item.totalprice || 0)
    const discount = Number(item.discount || 0)

    if (!qtyPack || !total) continue

    // แตกแพ็ค → PCS
    const newQty = qtyPack * multiplier

    // ราคาสุทธิหลังหักส่วนลดสินค้า
    // Shopee ใช้ pricePerUnitOri จาก discount ใน listProduct
    // Channel อื่นคำนวณจาก total + discount (ระบบไปหักเองแล้ว)
    const netItemAmount = (data.saleschannel === 'Shopee' && Number(item.pricePerUnitOri) > 0)
      ? item.pricePerUnitOri
      : total + discount



    const pricePerUnitOri = netItemAmount / newQty

    if (data.saleschannel === 'Shopee') {
      const pricePerUnitOriSHTotal = Number(item.pricePerUnitOri || 0)
      const pricePerUnitOriSH =
        (pricePerUnitOriSHTotal * item.quantity) / newQty

      const netItemAmountSH = pricePerUnitOriSH * newQty

      item.quantity = newQty // ✅ จุดที่หายไป
      item.pricePerUnitOri = pricePerUnitOriSH
      item.pricePerUnit = pricePerUnitOriSH
      item.totalprice = netItemAmountSH
    } else {
      item.quantity = newQty // ✅ จุดที่หายไป
      item.pricePerUnitOri = pricePerUnitOri
      item.pricePerUnit = pricePerUnitOri
      item.totalprice = total // คงราคาก่อน platform discount
    }
  }

  // ================================
  // FIX ROUNDING MISMATCH (ERP SAFE)
  // ================================
  {
    const expanded = []

    if (data.saleschannel == 'Lazada') {
      for (const item of listProduct) {
        if (isRoundingMismatch(item)) {
          const splitted = splitItemGrouped(item)

          // optional debug log
          console.log('[ERP ROUND SPLIT]', {
            itemCode: item.itemCode,
            before: {
              qty: item.quantity,
              unit: item.pricePerUnitOri,
              total: item.totalprice
            },
            after: splitted.map(s => ({
              qty: s.quantity,
              unit: s.pricePerUnitOri,
              total: s.totalprice
            }))
          })

          expanded.push(...splitted)
        } else {
          expanded.push(item)
        }
      }
      listProduct = resequenceItemNumber(expanded)
    }
  }

  // ================================
  // SET PROCODE FOR FREE / PREMIUM
  // ================================
  for (const item of listProduct) {
    if (!item?.sku) continue

    const parts = item.sku.split('_').filter(Boolean)
    const skuSuffix = parts.at(-1) // Free / Premium

    if (skuSuffix === 'Free') {
      item.procode = 'FV2F'
      item.pricePerUni = 0
      item.pricePerUnitOri = 0
      item.totalprice = 0
    } else if (skuSuffix === 'Premium') {
      item.procode = 'FV2P'
      item.pricePerUni = 0
      item.pricePerUnitOri = 0
      item.totalprice = 0
    }
  }

  // ================================
  // SHIPPING
  // ================================
  if (Number(data.shippingamount) > 0 && data.saleschannel !== 'Lazada') {
    const CODE = 'ZNS1401001_JOB'
    if (!listProduct.some(p => p.itemCode === CODE)) {
      listProduct.push({
        itemNumber: listProduct.length + 1,
        id: Number(orderId),
        productid: 9999999,
        procode: '',
        sku: CODE,
        itemCode: CODE,
        unit: 'JOB',
        name: 'ค่าขนส่ง',
        quantity: 1,
        discount: 0,
        discountChanel: '',
        pricePerUnitOri: Number(data.shippingamount),
        pricePerUnit: Number(data.shippingamount),
        totalprice: Number(data.shippingamount)
      })
    }
  }

  // ================================
  // DISCOUNT / VOUCHER
  // ================================

  let recalculatedAmount = null // default = ไม่คิดใหม่

  // if (data.saleschannel === 'Lazada' && Number(data.discount) > 0) {
  //   const CODE = 'DISONLINE'
  //   const discount = Number(data.discount)
  //   const sellerdiscount = Number(data.sellerdiscount)

  //   const discountValue = Number(discount + sellerdiscount)

  //   // ➕ 2) เพิ่ม DISONLINE (เป็นบวกได้ เพราะระบบไปหักเอง)
  //   if (!listProduct.some(p => p.itemCode === CODE)) {
  //     listProduct.push({
  //       itemNumber: listProduct.length + 1,
  //       id: Number(orderId),
  //       productid: CODE,
  //       procode: '',
  //       sku: CODE,
  //       itemCode: CODE,
  //       unit: 'PCS',
  //       name: 'DISONLINE',
  //       quantity: 1,
  //       discount: 0,
  //       discountChanel: '',
  //       pricePerUnitOri: discountValue,
  //       pricePerUnit: discountValue,
  //       totalprice: discountValue
  //     })
  //   }
  // }

  if (data.saleschannel === 'Shopee' && Number(data.sellerdiscount) > 0) {
    const CODE = 'DISONLINE'
    const discount = Number(data.discount)
    const sellerdiscount = Number(data.sellerdiscount)
    const discountValue = Number(sellerdiscount)

    // 🔁 1) คิด totalprice ใหม่จาก pricePerUnitOri * quantity
    listProduct = recalcListProductTotal(listProduct)

    // ➕ 2) เพิ่ม DISONLINE (เป็นบวกได้ เพราะระบบไปหักเอง)
    if (!listProduct.some(p => p.itemCode === CODE)) {
      listProduct.push({
        itemNumber: listProduct.length + 1,
        id: Number(orderId),
        productid: CODE,
        procode: '',
        sku: CODE,
        itemCode: CODE,
        unit: 'PCS',
        name: 'DISONLINE',
        quantity: 1,
        discount: 0,
        discountChanel: '',
        pricePerUnitOri: discountValue,
        pricePerUnit: discountValue,
        totalprice: discountValue
      })
    }

    // 🔢 3) รวมยอดใหม่ทั้ง order
    // recalculatedAmount = sumOrderAmount(listProduct)
  }

  // ================================
  // CREATE OR UPDATE
  // ================================
  let finalAmount = calculateOrderAmount(listProduct)

  // 🔍 เช็ค Lazada → เพิ่ม platformdiscount แม็กเพิ่มวันที่ 22/4/26
  if (data.saleschannel === 'Lazada' && Number(data.platformdiscount) > 0) {
    finalAmount += Number(data.platformdiscount)
  }

  if (!order) {
    await Order.create({
      id: orderId,
      ...data,
      amount: finalAmount,
      paymentstatus: 'Paid',
      statusprint: '000',
      statusprintinv: '',
      statusPrininvSuccess: '000',
      totalprint: 0,
      listProduct
    })
    console.log(`[Webhook] Order ${orderNumber} created (Paid)`)
    return
  }

  order.paymentstatus = 'Paid'
  order.status = data.status || order.status
  order.updatedatetime = data.updatedatetime
  order.updatedatetimeString = data.updatedatetimeString
  order.vatamount = data.vatamount
  order.currency = data.currency
  order.listProduct = listProduct
  order.amount = finalAmount
  order.totalproductamount = finalAmount
  // order.statusprint = '000'

  await order.save()

  console.log(
    `[Webhook] Order ${orderNumber} updated`,
    listProduct.map(p => p.itemCode)
  )
}

function calculateOrderAmount (listProduct = []) {
  return listProduct.reduce((sum, item) => {
    if (!item) return sum
    if (item.itemCode === 'DISONLINE') return sum

    const value = Number(item.totalprice ?? 0)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)
}

function recalcListProductTotal (listProduct = []) {
  return listProduct.map(item => {
    // ❗ ข้าม DISONLINE และค่าขนส่ง
    if (['DISONLINE', 'ZNS1401001_JOB'].includes(item.itemCode)) {
      return item
    }

    const qty = Number(item.quantity || 0)
    const priceOri = Number(item.pricePerUnitOri || 0)

    return {
      ...item,
      pricePerUnit: priceOri,
      totalprice: qty * priceOri
    }
  })
}

exports.handleOrderCanceled = async data => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  if (!data) return

  // รองรับหลาย case จาก webhook
  const isCanceled =
    data.paymentstatus === 'Voided' ||
    data.status === 'Voided' ||
    data.status === 'Cancelled' ||
    data.status === 'Canceled'

  if (!isCanceled) return

  const orderId = String(data.id)
  const orderNumber = data.number

  if (!orderId || !orderNumber) {
    throw new Error('Invalid webhook payload (cancel)')
  }

  let order = await Order.findOne({ id: orderId })

  // ================================
  // CASE 1: ยังไม่เคยมี order
  // ================================
  if (!order) {
    await Order.create({
      id: orderId,
      ...data,
      paymentstatus: 'Voided',
      status: 'Voided',
      statusprint: '000',
      statusprintinv: '',
      statusPrininvSuccess: '000',
      totalprint: 0,
      listProduct: data.list, // ❌ ยกเลิก ไม่ต้องมีสินค้า
      cancelReason: data.cancelReason || data.reason || ''
    })

    console.log(`[Webhook] Order ${orderNumber} created as CANCELED`)
    return
  }

  // ================================
  // CASE 2: มี order อยู่แล้ว → update
  // ================================
  order.paymentstatus = 'Voided'
  order.status = 'Voided'
  order.cancelReason = data.cancelReason || data.reason || ''
  order.updatedatetime = data.updatedatetime
  order.updatedatetimeString = data.updatedatetimeString

  // ไม่ยุ่งกับ listProduct (เผื่อ audit)
  await order.save()

  console.log(`[Webhook] Order ${orderNumber} marked as CANCELED`)
}

exports.handleMakroShippingOrders = async () => {
  try {
    console.log('[Makro] Fetch SHIPPING orders start')

    const headers = {
      Accept: 'application/json',
      Authorization: process.env.frontKeyMakro
    }

    // ================================
    // 1️⃣ ดึงรอบแรก เพื่อรู้ total_count
    // ================================
    const firstRes = await axios.get(
      `${process.env.urlMakro}/api/orders?order_state_codes=SHIPPING&max=100&offset=0&order=asc`,
      { headers }
    )

    const totalCount = firstRes.data.total_count || 0
    let allOrders = [...(firstRes.data.orders || [])]

    if (totalCount === 0) {
      console.log('[Makro] No SHIPPING orders found')
      return { total_count: 0, orders: [] }
    }

    const maxLoop = Math.ceil(totalCount / 100)

    // ================================
    // 2️⃣ loop ดึง order ที่เหลือ
    // ================================
    for (let i = 1; i < maxLoop; i++) {
      const offset = i * 100

      const res = await axios.get(
        `${process.env.urlMakro}/api/orders?order_state_codes=SHIPPING&max=100&offset=${offset}&order=asc`,
        { headers }
      )

      allOrders.push(...(res.data.orders || []))
    }

    console.log(
      `[Makro] Fetch SHIPPING orders success (${allOrders.length}/${totalCount})`
    )

    return {
      total_count: totalCount,
      orders: allOrders
    }
  } catch (error) {
    console.error('[Makro] Fetch SHIPPING orders failed', error.message)
    throw error
  }
}
