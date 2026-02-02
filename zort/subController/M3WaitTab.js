const express = require('express')
const axios = require('axios')
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer')
const { getModelsByChannel } = require('../../authen/middleware/channel')
const moment = require('moment')

function getThaiDayRange (day) {
  return {
    start: new Date(`${day}T00:00:00.000+07:00`),
    end: new Date(`${day}T23:59:59.999+07:00`)
  }
}
async function M3WaitTab (res, channel, body) {
  try {
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { date } = body // '2026-01-17'

    let dateCondition = {}
    if (date) {
      const { start, end } = getThaiDayRange(date)
      dateCondition.updatedAt = { $gte: start, $lte: end }
    }

    const data = await Order.find({
      status: { $nin: ['Voided', 'Cancelled'] },
      statusM3: { $ne: 'success' },
      cono: { $ne: '' },
      invno: { $ne: '' },
      // ...dateCondition
    })
      .sort({ updatedAt: -1 })
      .lean()

    if (!data.length) return []

    // 2️⃣ map เป็น response
    const orders = data.map(row => {
      const items = (row.listProduct || []).map(item => ({
        productid: item.productid,
        procode: item.procode,
        sku: item.sku?.split('_')[0],
        unit: item.sku?.split('_')[1],
        name: item.name,
        discount: item.discount,
        nameM3Full: item.nameM3Full,
        nameM3: item.nameM3,
        number: item.quantity,
        pricepernumber: item.pricePerUnit,
        pricepernumberOri: item.pricePerUnitOri,
        totalprice: item.totalprice
      }))

      // map status text
      const statusText =
        row.status === 'Success'
          ? 'สำเร็จ'
          : row.status === 'Cancelled'
          ? 'ยกเลิก'
          : row.status === 'Shipped'
          ? 'รอส่ง'
          : row.status === 'Pending'
          ? 'รอโอน'
          : 'พบข้อผิดพลาด'

      const paymentstatusText =
        row.paymentstatus === 'Paid'
          ? 'ชำระแล้ว'
          : row.paymentstatus === 'Cancelled'
          ? 'ยกเลิก'
          : row.paymentstatus === 'Pending'
          ? 'รอชำระ'
          : 'พบข้อผิดพลาด'

      const taxInStatus = row.customeridnumber != '' ? 'ขอใบกำกับภาษี' : ''

      return {
        id: row.id,
        printdatetimeString: row.printdatetimeString,
        cono: row.cono,
        invno: row.invno,
        invstatus: taxInStatus,
        orderdate: row.orderdate,
        orderdateString: row.orderdateString,
        printdate: row.updatedatetime,
        printdatetime: row.updatedatetimeString,
        number: row.number,
        customerid: row.customerid,
        customercode: row.customercode,
        customer: row.customername || '', // ✅ ใช้จาก Order
        status: row.status,
        statusText,
        paymentstatus: row.paymentstatus,
        paymentstatusText,
        amount: row.amount,
        vatamount: row.vatamount,
        shippingchannel: row.shippingchannel,
        shippingamount: row.shippingamount,
        shippingstreetAddress: row.shippingstreetAddress,
        shippingsubdistrict: row.shippingsubdistrict,
        shippingdistrict: row.shippingdistrict,
        shippingprovince: row.shippingprovince,
        shippingpostcode: row.shippingpostcode,
        createdatetime: row.createdatetime,
        statusprint: row.statusprint,
        statusprintinv: row.statusprintinv,
        totalprint: row.totalprint || 0,
        saleschannel: row.saleschannel,
        isCOD: row.isCOD == '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง',
        item: items
      }
    })

    // เรียง invno อีกรอบ (ถ้าจำเป็น)
    orders.sort((a, b) => (b.invno || '').localeCompare(a.invno || ''))

    return orders
  } catch (error) {
    console.error(error)
    return { status: 'dataNotFound' }
  }
}

module.exports = M3WaitTab
