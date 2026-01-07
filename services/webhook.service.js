const orderModel = require('../model/order')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')
const axios = require('axios')
const _ = require('lodash')
async function handleOrderCreated (data) {
  // 1. เช็คว่า order ซ้ำไหม
  // 2. save ลง DB
  // 3. trigger workflow อื่น
}

// exports.handleOrderPaid = async data => {
//   const channel = 'uat'
//   //   const channel = 'uat'
//   const { Order } = getModelsByChannel(channel, null, orderModel)
//   const { Product } = getModelsByChannel(channel, null, productModel)
//   if (!data || data.paymentstatus !== 'Paid') {
//     console.log('[Webhook] paymentstatus not Paid → skip')
//     return
//   }

//   const orderId = String(data.id)
//   const orderNumber = data.number

//   if (!orderId || !orderNumber) {
//     throw new Error('Invalid webhook payload: missing id or number')
//   }

//   // 1️⃣ หา order เดิม
//   let order = await Order.findOne({ id: orderId })

//   // 2️⃣ map list → listProduct
//   const listProduct = Array.isArray(data.list)
//     ? data.list.map(item => ({
//         itemNumber: item.itemNumber,
//         id: item.id ? Number(item.id) : data.id,
//         productid: item.productid,
//         procode: item.proCode || '',
//         sku: item.sku,
//         itemCode: item.itemCode,
//         unit: item.unit,
//         name: item.name,
//         quantity: item.quantity,
//         discount: item.discount || 0,
//         discountChanel: item.discountChanel || '',
//         pricePerUnitOri: item.pricePerUnitOri ?? item.pricePerUnit,
//         pricePerUnit: item.pricePerUnit,
//         totalprice: item.totalprice
//       }))
//     : []

//   // 3️⃣ ถ้าไม่เจอ → สร้างใหม่ (Paid มาก่อน Created)
//   if (!order) {
//     await Order.updateOne(
//       { id: orderId },
//       {
//         $setOnInsert: {
//           id: orderId,
//           ...data,
//           listProduct
//         }
//       },
//       { upsert: true }
//     )
//     console.log(`[Webhook] Order ${orderNumber} created (Paid)`)
//     return
//   }

//   // 4️⃣ กันยิงซ้ำ
//   // if (order.paymentstatus === 'Paid') {
//   //   console.log(`[Webhook] Order ${orderNumber} already Paid → skip`)
//   //   return
//   // }

//   if (data.shippingamount > 0) {
//     const baseItemNumber = listProduct.length + 1

//     // 1️⃣ item ค่าขนส่ง (ของเดิมคุณ)
//     const shippingSku = 'ZNS1401001_JOB'
//     const shippingProductId = 9999999

//     const shipping = {
//       itemNumber: baseItemNumber,
//       id: Number(data.id),
//       productid: shippingProductId,
//       procode: '',
//       sku: shippingSku,
//       itemCode: shippingSku,
//       unit: 'JOB',
//       name: 'ค่าขนส่ง',
//       quantity: 1,
//       discount: 0,
//       discountChanel: '',
//       pricePerUnitOri: Number(data.shippingamount),
//       pricePerUnit: Number(data.shippingamount),
//       totalprice: Number(data.shippingamount)
//     }

//     listProduct.push(shipping)

//   }

//   if (data.discountamount > 0) {

//     const baseItemNumber = listProduct.length + 1

//     // 1️⃣ item ค่าขนส่ง (ของเดิมคุณ)
//     const discountOnlineSku = 'DISONLINE'
//     const discountOnlineProductId = 'DISONLINE'

//     const discountOnline = {
//       itemNumber: baseItemNumber,
//       id: Number(data.id),
//       productid: discountOnlineProductId,
//       procode: '',
//       sku: discountOnlineSku,
//       itemCode: discountOnlineSku,
//       unit: 'PCS',
//       name: 'DISONLINE',
//       quantity: 1,
//       discount: 0,
//       discountChanel: '',
//       pricePerUnitOri: Number(data.discountamount),
//       pricePerUnit: Number(data.discountamount),
//       totalprice: Number(data.discountamount)
//     }
//     โ.push(discountOnline)
//   }

//   // 5️⃣ update order เดิม
//   order.paymentstatus = 'Paid'
//   order.status = data.status || order.status
//   order.updatedatetime = data.updatedatetime
//   order.updatedatetimeString = data.updatedatetimeString
//   order.amount = data.amount
//   order.vatamount = data.vatamount
//   order.totalproductamount = data.totalproductamount || data.amount
//   order.currency = data.currency
//   order.listProduct = listProduct

//   await order.save()
//   // console.log(order.listProduct)

//   console.log(`[Webhook] Order ${orderNumber} marked as Paid`)
// }

exports.handleOrderPaid = async data => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  if (!data || data.paymentstatus !== 'Paid') return

  const orderId = String(data.id)
  const orderNumber = data.number
  if (!orderId || !orderNumber) {
    throw new Error('Invalid webhook payload')
  }

  let order = await Order.findOne({ id: orderId })

  // ================================
  // BASE listProduct (ใช้เหมือนกัน)
  // ================================
  const baseList = Array.isArray(order?.listProduct)
    ? [...order.listProduct]
    : Array.isArray(data.list)
    ? data.list.map(item => ({
        itemNumber: item.itemNumber,
        id: Number(orderId),
        productid: item.productid,
        procode: item.proCode || '',
        sku: item.sku,
        itemCode: item.itemCode,
        unit: item.unit,
        name: item.name,
        quantity: item.quantity,
        discount: item.discount || 0,
        discountChanel: item.discountChanel || '',
        pricePerUnitOri: item.pricePerUnitOri ?? item.pricePerUnit,
        pricePerUnit: item.pricePerUnit,
        totalprice: item.totalprice
      }))
    : []

  const listProduct = [...baseList]

  // ================================
  // SHIPPING
  // ================================
  if (Number(data.shippingamount) > 0) {
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
  const discountValue = Number(data.discountamount || data.voucheramount || 0)

  if (discountValue > 0) {
    const CODE = 'DISONLINE'
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
  }

  // ================================
  // CREATE OR UPDATE
  // ================================
  if (!order) {
    await Order.create({
      id: orderId,
      ...data,
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
  order.amount = data.amount
  order.vatamount = data.vatamount
  order.totalproductamount = data.totalproductamount || data.amount
  order.currency = data.currency
  order.listProduct = listProduct
  // order.statusprint = '000'

  await order.save()

  console.log(
    `[Webhook] Order ${orderNumber} updated`,
    listProduct.map(p => p.itemCode)
  )
}

async function handleOrderCancelled (data) {
  // rollback / mark cancelled
}
