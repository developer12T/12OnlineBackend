const express = require('express')
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer')
const { getModelsByChannel } = require('../../authen/middleware/channel')
const { Op } = require('sequelize')

async function InvReprint (res, channel, dateFilter = {}) {
  try {
    const { Order } = getModelsByChannel(channel, res, orderModel)
    let whereClause = {}

    console.log(dateFilter)

    if (dateFilter.startDate && dateFilter.endDate) {
      whereClause.printdatetimeString = {
        $gte: new Date(dateFilter.startDate).toISOString(),
        $lte: new Date(dateFilter.endDate).toISOString()
      }
    }

    whereClause.status = {
      $ne: 'Cancelled'
    }

    const data = await Order.find(whereClause, {
      updatedAt: 1,
      orderdate: 1,
      status: 1,
      number: 1,
      id: 1,
      saleschannel: 1,
      invno: 1,
      cono: 1,
      printdatetimeString: 1,
      listProduct: 1
    })
      .sort({ orderdate: -1, invno: -1 })
      .lean()

    const orders = data.map(row => {
      const items = (row.listProduct || []).map(item => ({
        productid: item.productid,
        sku: item.sku?.split('_')[0],
        unit: item.sku?.split('_')[1],
        name: item.name,
        nameM3Full: item.nameM3Full,
        nameM3: item.nameM3,
        number: item.quantity,
        pricepernumber: item.pricePerUnit,
        totalprice: item.totalprice
      }))

      return {
        printdatetimeString: row.printdatetimeString,
        number: row.number,
        id: row.id,
        orderdate: row.orderdate,
        status: row.status,
        saleschannel: row.saleschannel,
        invno: row.invno,
        cono: row.cono,
        item: items
      }
    })

    return orders
  } catch (error) {
    console.error(error)
    return { status: 'dataNotFound' }
  }
}

module.exports = InvReprint
