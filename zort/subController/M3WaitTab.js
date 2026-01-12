const express = require('express')
const axios = require('axios')
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer')
const { getModelsByChannel } = require('../../authen/middleware/channel')
const moment = require('moment')
const currentDate = moment().utcOffset(7).format('YYYY-MM-DD')
// function today() {
const currentDateTime = moment().utcOffset(7).format('YYYY-MM-DDTHH:mm')

async function M3WaitTab (res, channel) {
  try {
    const { Order } = getModelsByChannel(channel, res, orderModel)
    const { Customer } = getModelsByChannel(channel, res, customerModel)

    const data = await Order.find({
      //   statusprint: '000',
      //   statusPrininvSuccess: '000',
      status: { $ne: 'Voided' },
      statusM3: { $ne: 'success' },
      cono: { $ne: '' },
      invno: { $ne: '' },
      $or: [{ paymentstatus: 'PAY_ON_ACCEPTANCE' }, { paymentstatus: 'Paid' }]
    })
    // console.log("data",data)
    const orders = []

    for (const row of data) {
      const itemData = data.find(item => item.id === row.id)

      // console.log("itemData", itemData)

      let cusdata
      if (
        (row.customeriderp === 'OLAZ000000' && row.saleschannel === 'Lazada') ||
        (row.customeriderp === 'OAMZ000000' && row.saleschannel === 'Amaze')
      ) {
        cusdata = await Customer.findOne({ customerid: row.customerid }).select(
          'customername customerid customeriderp customercode'
        )
      } else {
        cusdata = await Customer.findOne({ customerid: row.customerid }).select(
          'customername customerid customeriderp customercode'
        )
      }
      const cuss = cusdata?.customername || ''

      const items = itemData.listProduct.map(item => ({
        productid: item.productid,
        sku: item.sku.split('_')[0],
        unit: item.sku.split('_')[1],
        name: item.name,
        number: item.quantity,
        pricepernumber: item.pricePerUnit,
        totalprice: item.totalprice
      }))

      const totalprint = row.totalprint ?? 0
      const taxInStatus =
        row.statusprintinv === 'TaxInvoice' ? 'ขอใบกำกับภาษี' : ''
      const statusText =
        {
          Success: 'สำเร็จ',
          Voided: 'ยกเลิก',
          Waiting: 'รอส่ง',
          Pending: 'รอโอน'
        }[row.status] || 'พบข้อผิดพลาด'

      const paymentstatusText =
        {
          Paid: 'ชำระแล้ว',
          Voided: 'ยกเลิก',
          Pending: 'รอชำระ'
        }[row.paymentstatus] || 'พบข้อผิดพลาด'

      const isCOD = row.isCOD == '1' ? 'เก็บปลายทาง' : 'ไม่เก็บปลายทาง'

      const order = {
        id: row.id,
        cono: row.cono,
        invno: row.invno,
        orderdate: row.orderdate,
        orderdateString: row.orderdateString,
        printdate: currentDate,
        printdatetime: currentDateTime,
        number: row.number,
        customerid: row.customerid,
        status: row.status,
        statusText: statusText,
        paymentstatus: row.paymentstatus,
        paymentstatusText: paymentstatusText,
        amount: row.amount,
        discount: row.discount,
        discountamount: row.discountamount,
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
        invstatus: taxInStatus,
        totalprint: totalprint,
        saleschannel: row.saleschannel,
        item: items,
        customer: cuss,
        isCOD: isCOD
      }
      orders.push(order)
    }
    return orders
  } catch (error) {
    console.error(error)
    return { status: 'dataNotFound' }
  }
}

module.exports = M3WaitTab
