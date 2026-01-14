const express = require('express')
const orderModel = require('../../model/order')
const customerModel = require('../../model/customer')
const { getModelsByChannel } = require('../../authen/middleware/channel')
const { Op } = require('sequelize')

async function InvReprint (res, channel, dateFilter = {}) {
  try {
    const { Order } = getModelsByChannel(channel, res, orderModel)
    let whereClause = {}

    if (dateFilter.startDate && dateFilter.endDate) {
      whereClause.updatedAt = {
        $gte: new Date(dateFilter.startDate),
        $lte: new Date(dateFilter.endDate)
      }
    }

    const data = await Order.find(whereClause, {
      updatedAt: 1,
      number: 1,
      id: 1,
      saleschannel: 1,
      invno: 1,
      cono: 1,
      listProduct: 1
    })
      .sort({ updatedAt: 1, invno: 1 })
      .lean()

    const orders = data.map(row => {
      const items = (row.listProduct || []).map(item => {
        const [sku = '', unit = ''] = item.sku?.split('_') || []

        return {
          productid: item.productid,
          sku,
          unit,
          name: item.name,
          number: item.number,
          pricepernumber: item.pricepernumber,
          totalprice: item.totalprice
        }
      })

      return {
        updatedAt: row.updatedAt,
        number: row.number,
        id: row.id,
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
