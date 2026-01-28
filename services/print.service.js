const orderModel = require('../model/order')
const { getModelsByChannel } = require('../authen/middleware/channel')
const {
  getNextRunning,
  getNextRunningFromOOHEAD
} = require('../services/runningNumber.service')
const axios = require('axios')

function getThaiYear () {
  return (new Date().getFullYear() + 543).toString()
}

exports.prepareOrdersForPrint = async checklist => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  const orders = await Order.find(
    { id: { $in: checklist }, invno: { $in: [null, '', undefined] } },
    { id: 1 }
  ).lean()

  for (const order of orders) {
    // ⚠️ ทำเฉพาะที่ยังไม่เคย prepare
    const response = await axios.post(
      process.env.API_URL_12ERP + '/master/runningNumber',
      { coNo: 410, series: 'ง', seriesType: '01' }
    )

    const cono = response.data.lastNo
    const invno = await getNextRunningFromOOHEAD('171')

    await Order.updateOne(
      { id: order.id, invno: { $in: [null, '', undefined] } },
      {
        $set: {
          invno,
          cono,
          printdatetimeString: new Date().toISOString(),
          statusprint: '001',
          statusPrininvSuccess: '001'
        },
        $inc: { totalprint: 1 },
        $currentDate: { updatedAt: true }
      }
    )

    await axios.post(
      process.env.API_URL_12ERP + '/master/runningNumber/update',
      {
        coNo: 410,
        series: 'ง',
        seriesType: '01',
        lastNo: cono + 1
      }
    )
  }
}

exports.getOrdersForPrint2 = async checklist => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  return Order.find(
    { id: { $in: checklist } },
    {
      id: 1,
      number: 1,
      cono: 1,
      invno: 1,
      discount: 1,
      amount: 1,
      vatamount: 1,
      customername: 1,
      customercode: 1,
      customeridnumber: 1,
      shippingaddress: 1,
      updatedAt: 1,
      listProduct: 1
    }
  )
    .lean()
    .sort({ createdatetime: 1 })
}

/**
 * ดึง order สำหรับพิมพ์
 * - assign invno (ถ้ายังไม่มี)
 * - update statusprint = success
 * - increment totalprint
 */

exports.getOrdersForPrint = async checklist => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  /* ===============================
   * 1) ดึง orders
   * =============================== */
  const orders = await Order.find(
    { id: { $in: checklist } },
    {
      id: 1,
      number: 1,
      cono: 1,
      invno: 1,
      statusprint: 1,
      discountamount: 1,
      discount: 1,
      totalproductamount: 1,
      totalprint: 1,
      customername: 1,
      customercode: 1,
      customerid: 1,
      customeridnumber: 1,
      shippingaddress: 1,
      shippingphone: 1,
      createdatetimeString: 1,
      printdatetimeString: 1,
      amount: 1,
      vatamount: 1,
      saleschannel: 1,
      updatedAt: 1,
      listProduct: 1
    }
  )
    .lean()
    .sort({ createdatetime: 1 })

  if (!orders.length) return []

  /* ===============================
   * 2) หา order ที่ยังไม่มี invno
   * =============================== */
  const needRunningOrders = orders.filter(o => !o.invno)
  const needSize = needRunningOrders.length

  let startCono = null

  /* ===============================
   * 3) RESERVE ERP RUNNING (ครั้งเดียว)
   * =============================== */
  if (needSize > 0) {
    const erpRes = await axios.post(
      process.env.API_URL_12ERP + '/master/runningNumber/reserve',
      {
        coNo: 410,
        series: 'ง',
        seriesType: '01',
        size: needSize
      }
    )

    if (!erpRes.data?.startNo) {
      throw new Error('ERP reserve running failed')
    }

    startCono = erpRes.data.startNo
  }

  /* ===============================
   * 4) แจกเลข + เตรียม bulk ops
   * =============================== */
  let currentCono = startCono
  const now = new Date()

  const bulkOps = []

  for (const order of orders) {
    let invno = order.invno
    let cono = order.cono

    if (!invno && currentCono !== null) {
      cono = currentCono
      invno = await getNextRunning('171') // ถ้าอันนี้ยังเป็น Mongo counter ถือว่าปลอดภัย
      currentCono++
    }

    bulkOps.push({
      updateOne: {
        filter: { id: order.id },
        update: {
          $set: {
            ...(invno && { invno, cono }),
            statusprint: '001',
            statusPrininvSuccess: '001',
            printdatetimeString: new Date().toISOString()
          },
          $inc: { totalprint: 1 },
          $currentDate: { updatedAt: true }
        }
      }
    })

    // sync กลับ memory
    order.invno = invno
    order.cono = cono
    order.statusprint = '001'
    order.statusPrininvSuccess = '001'
    order.totalprint = (order.totalprint || 0) + 1
    order.updatedAt = now
    order.printdatetimeString = new Date().toISOString()
  }

  /* ===============================
   * 5) BULK UPDATE (ทีเดียวจบ)
   * =============================== */
  if (bulkOps.length) {
    await Order.bulkWrite(bulkOps)
  }

  return orders
}

// exports.getOrdersForPrint = async checklist => {
//   const channel = 'uat'
//   const { Order } = getModelsByChannel(channel, null, orderModel)

//   // 1️⃣ ดึง orders
//   let orders = await Order.find(
//     { id: { $in: checklist } },
//     {
//       id: 1,
//       number: 1,
//       cono: 1,
//       invno: 1,
//       statusprint: 1,
//       discountamount: 1,
//       discount: 1,
//       totalproductamount: 1,
//       totalprint: 1,
//       customername: 1,
//       customercode: 1,
//       customerid: 1,
//       customeridnumber: 1,
//       shippingaddress: 1,
//       shippingphone: 1,
//       createdatetimeString: 1,
//       printdatetimeString: 1,
//       amount: 1,
//       vatamount: 1,
//       totalproductamount: 1,
//       saleschannel: 1,
//       updatedAt: 1,
//       listProduct: 1
//     }
//   )
//     .lean()
//     .sort({ createdatetime: 1 })

//   // 2️⃣ วนจัดการทีละ order (ปลอดภัยสุด)
//   for (const order of orders) {
//     let invno = order.invno
//     // 2.1 ถ้ายังไม่มี invno → generate
//     if (!invno) {
//       const response = await axios.post(
//         process.env.API_URL_12ERP + '/master/runningNumber',
//         {
//           coNo: 410,
//           series: 'ง',
//           seriesType: '01'
//         }
//       )
//       const cono = response.data.lastNo
//       console.log('cono', cono)

//       invno = await getNextRunning('171') // หรือ map ตาม channel

//       await Order.updateOne(
//         {
//           id: order.id,
//           invno: { $in: [null, '', undefined] }
//         },
//         {
//           $set: {
//             invno,
//             cono,
//             printdatetimeString: new Date().toISOString()
//           },
//           $currentDate: { updatedAt: true }
//         }
//       )

//       order.invno = invno
//       order.cono = cono
//       const lastNo = cono + 1
//       await axios.post(
//         process.env.API_URL_12ERP + '/master/runningNumber/update',
//         {
//           coNo: 410,
//           series: 'ง',
//           seriesType: '01',
//           lastNo: lastNo
//         }
//       )
//     }

//     // 2.2 update statusprint + totalprint
//     await Order.updateOne(
//       { id: order.id },
//       {
//         $set: {
//           statusprint: '001',
//           statusPrininvSuccess: '001'
//         },
//         $inc: {
//           totalprint: 1
//         },
//         $currentDate: { updatedAt: true }
//       }
//     )
//     const now = new Date()
//     // sync กลับเข้า memory
//     order.statusprint = '001'
//     order.statusPrininvSuccess = '001'
//     order.totalprint = (order.totalprint || 0) + 1
//     order.updatedAt = now
//   }

//   return orders
// }

exports.getOrdersForPrint2 = async checklist => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  return Order.find(
    { id: { $in: checklist } },
    {
      id: 1,
      number: 1,
      cono: 1,
      invno: 1,
      discount: 1,
      amount: 1,
      vatamount: 1,
      customername: 1,
      customercode: 1,
      customeridnumber: 1,
      shippingaddress: 1,
      updatedAt: 1,
      listProduct: 1
    }
  )
    .lean()
    .sort({ createdatetime: 1 })
}

/**
 * พิมพ์สำเนา (Copy)
 * - ไม่ assign invno
 * - ไม่ update updatedAt
 * - ไม่ call ERP
 * - increment totalprint (ถ้าต้องการนับ)
 */
exports.getOrdersForPrintCopy = async checklist => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  // 1️⃣ ดึง orders
  const orders = await Order.find(
    { id: { $in: checklist } },
    {
      id: 1,
      number: 1,
      cono: 1,
      invno: 1,
      statusprint: 1,
      totalprint: 1,
      customername: 1,
      customercode: 1,
      customerid: 1,
      customeridnumber: 1,
      shippingaddress: 1,
      shippingphone: 1,
      createdatetimeString: 1,
      printdatetimeString: 1,
      amount: 1,
      vatamount: 1,
      totalproductamount: 1,
      saleschannel: 1,
      updatedAt: 1,
      listProduct: 1
    }
  )
    .lean()
    .sort({ createdatetime: 1 })

  // 2️⃣ update เฉพาะ totalprint (ไม่มี updatedAt)
  for (const order of orders) {
    await Order.updateOne(
      { id: order.id },
      {
        $inc: { totalprint: 1 }
        // ❌ ไม่มี $currentDate
      }
    )

    // sync memory
    order.totalprint = (order.totalprint || 0) + 1
  }

  return orders
}
