const orderModel = require('../model/order')
const { getModelsByChannel } = require('../authen/middleware/channel')

async function handleOrderCreated (data) {
  // 1. เช็คว่า order ซ้ำไหม
  // 2. save ลง DB
  // 3. trigger workflow อื่น
}
exports.handleOrderPaid = async data => {
  const channel = 'uat'
//   const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  if (!data || data.paymentstatus !== 'Paid') {
    console.log('[Webhook] paymentstatus not Paid → skip')
    return
  }

  const orderId = String(data.id)
  const orderNumber = data.number

  if (!orderId || !orderNumber) {
    throw new Error('Invalid webhook payload: missing id or number')
  }

  // 1️⃣ หา order เดิม
  let order = await Order.findOne({ id: orderId })

  // 2️⃣ map list → listProduct
  const listProduct = Array.isArray(data.list)
    ? data.list.map(item => ({
        itemNumber: item.itemNumber,
        id: item.id ? Number(item.id) : data.id,
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

  // 3️⃣ ถ้าไม่เจอ → สร้างใหม่ (Paid มาก่อน Created)
  if (!order) {
    await Order.create({
      ...data,
      listProduct
    })

    console.log(`[Webhook] Order ${orderNumber} created (Paid)`)
    return
  }

  // 4️⃣ กันยิงซ้ำ
  if (order.paymentstatus === 'Paid') {
    console.log(`[Webhook] Order ${orderNumber} already Paid → skip`)
    return
  }

  // 5️⃣ update order เดิม
  order.paymentstatus = 'Paid'
  order.status = data.status || order.status
  order.updatedatetime = data.updatedatetime
  order.updatedatetimeString = data.updatedatetimeString
  order.amount = data.amount
  order.vatamount = data.vatamount
  order.totalproductamount = data.totalproductamount || data.amount
  order.currency = data.currency
  order.listProduct = listProduct

  await order.save()

  console.log(`[Webhook] Order ${orderNumber} marked as Paid`)
}

async function handleOrderCancelled (data) {
  // rollback / mark cancelled
}
