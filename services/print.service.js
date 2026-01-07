const orderModel = require('../model/order')
const { getModelsByChannel } = require('../authen/middleware/channel')
const { getNextRunning } = require('../services/runningNumber.service')
const axios = require('axios')
/**
 * ดึง order สำหรับพิมพ์
 * - assign invno (ถ้ายังไม่มี)
 * - update statusprint = success
 * - increment totalprint
 */
exports.getOrdersForPrint = async checklist => {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  // 1️⃣ ดึง orders
  let orders = await Order.find(
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
      totalproductamount: 1,
      saleschannel: 1,
      updatedAt: 1,
      listProduct: 1
    }
  )
    .lean()
    .sort({ createdatetime: 1 })

  // 2️⃣ วนจัดการทีละ order (ปลอดภัยสุด)
  for (const order of orders) {
    let invno = order.invno
    const response = await axios.post(
      process.env.API_URL_12ERP + '/master/runningNumber',
      {
        coNo: 410,
        series: 'ง',
        seriesType: '01'
      }
    )
    const cono = response.data.lastNo
    console.log('cono', cono)
    const lastNo = cono + 1

    // 2.1 ถ้ายังไม่มี invno → generate
    if (!invno) {
      invno = await getNextRunning('171') // หรือ map ตาม channel

      await Order.updateOne(
        {
          id: order.id,
          invno: { $in: [null, '', undefined] }
        },
        {
          $set: {
            invno,
            cono,
            printdatetimeString: new Date().toISOString()
          },
          $currentDate: { updatedAt: true }
        }
      )

      order.invno = invno
      order.cono = cono
    }

    // 2.2 update statusprint + totalprint
    await Order.updateOne(
      { id: order.id },
      {
        $set: {
          statusprint: '001',
          statusPrininvSuccess: '001'
        },
        $inc: {
          totalprint: 1
        },
        $currentDate: { updatedAt: true }
      }
    )
    await axios.post(
      process.env.API_URL_12ERP + '/master/runningNumber/update',
      {
        coNo: 410,
        series: 'ง',
        seriesType: '01',
        lastNo: lastNo
      }
    )

    // sync กลับเข้า memory
    order.statusprint = '001'
    order.statusPrininvSuccess = '001'
    order.totalprint = (order.totalprint || 0) + 1
  }

  return orders
}
