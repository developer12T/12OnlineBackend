const orderModel = require('../model/order')
const { getModelsByChannel } = require('../authen/middleware/channel')

/**
 * Search order by order number
 * POST /online/api/order/search
 */
exports.searchOrder = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { number } = req.body

    if (!channel) {
      return res.status(400).json({
        status: 400,
        message: 'x-channel header is required'
      })
    }

    if (!number) {
      return res.status(400).json({
        status: 400,
        message: 'Order number is required'
      })
    }

    // Get the Order model for this channel
    const { Order } = getModelsByChannel(channel, res, orderModel)

    // Search for order by number field
    const order = await Order.findOne({ number: String(number) }).lean()

    if (!order) {
      return res.status(200).json([])
    }

    // Map MongoDB fields to frontend format
    const mappedOrder = {
      orderNumber: order.number,
      customerName: order.shippingname || order.customername || '',
      phone: order.shippingphone || '',
      address: order.shippingaddress || '',
      province: order.shippingprovince || '',
      district: order.shippingdistrict || '',
      postalCode: order.shippingpostcode || '',
      status: order.status || '',
      customerId: order.customerid || '',
      customerCode: order.customercode || '',
      email: order.shippingemail || '',
      subDistrict: order.shippingsubdistrict || '',
      // Include original fields for reference
      _id: order._id,
      paymentStatus: order.paymentstatus,
      marketplaceName: order.marketplacename
    }

    return res.status(200).json([mappedOrder])
  } catch (error) {
    console.error('Error searching order:', error)
    res.status(500).json({
      status: 500,
      message: 'Error searching order',
      error: error.message
    })
  }
}

/**
 * Update order shipping information
 * PUT /online/api/order/update/:orderNumber
 */
exports.updateOrderShipping = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { orderNumber } = req.params
    const {
      customerName,
      phone,
      address,
      province,
      district,
      postalCode,
      email,
      subDistrict
    } = req.body

    if (!channel) {
      return res.status(400).json({
        status: 400,
        message: 'x-channel header is required'
      })
    }

    if (!orderNumber) {
      return res.status(400).json({
        status: 400,
        message: 'Order number is required'
      })
    }

    // Get the Order model for this channel
    const { Order } = getModelsByChannel(channel, res, orderModel)

    // Build update object with only provided fields
    const updateData = {}

    if (customerName !== undefined) updateData.shippingname = customerName
    if (phone !== undefined) updateData.shippingphone = phone
    if (address !== undefined) updateData.shippingaddress = address
    if (province !== undefined) updateData.shippingprovince = province
    if (district !== undefined) updateData.shippingdistrict = district
    if (postalCode !== undefined) updateData.shippingpostcode = postalCode
    if (email !== undefined) updateData.shippingemail = email
    if (subDistrict !== undefined) updateData.shippingsubdistrict = subDistrict

    // Add timestamp
    updateData.updatedatetime = new Date().toISOString()

    // Find and update the order
    const updatedOrder = await Order.findOneAndUpdate(
      { number: String(orderNumber) },
      { $set: updateData },
      { new: true }
    )

    if (!updatedOrder) {
      return res.status(404).json({
        status: 404,
        message: 'Order not found'
      })
    }

    // Map the updated order to frontend format
    const mappedOrder = {
      orderNumber: updatedOrder.number,
      customerName: updatedOrder.shippingname || updatedOrder.customername || '',
      phone: updatedOrder.shippingphone || '',
      address: updatedOrder.shippingaddress || '',
      province: updatedOrder.shippingprovince || '',
      district: updatedOrder.shippingdistrict || '',
      postalCode: updatedOrder.shippingpostcode || '',
      status: updatedOrder.status || '',
      customerId: updatedOrder.customerid || '',
      customerCode: updatedOrder.customercode || '',
      email: updatedOrder.shippingemail || '',
      subDistrict: updatedOrder.shippingsubdistrict || ''
    }

    return res.status(200).json({
      status: 200,
      message: 'Order updated successfully',
      data: mappedOrder
    })
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).json({
      status: 500,
      message: 'Error updating order',
      error: error.message
    })
  }
}

/**
 * Get order by order number (alternative to search)
 * GET /online/api/order/:orderNumber
 */
exports.getOrderByNumber = async (req, res) => {
  try {
    const channel = req.headers['x-channel']
    const { orderNumber } = req.params

    if (!channel) {
      return res.status(400).json({
        status: 400,
        message: 'x-channel header is required'
      })
    }

    if (!orderNumber) {
      return res.status(400).json({
        status: 400,
        message: 'Order number is required'
      })
    }

    const { Order } = getModelsByChannel(channel, res, orderModel)

    const order = await Order.findOne({ number: String(orderNumber) }).lean()

    if (!order) {
      return res.status(404).json({
        status: 404,
        message: 'Order not found'
      })
    }

    // Map MongoDB fields to frontend format
    const mappedOrder = {
      orderNumber: order.number,
      customerName: order.shippingname || order.customername || '',
      phone: order.shippingphone || '',
      address: order.shippingaddress || '',
      province: order.shippingprovince || '',
      district: order.shippingdistrict || '',
      postalCode: order.shippingpostcode || '',
      status: order.status || '',
      customerId: order.customerid || '',
      customerCode: order.customercode || '',
      email: order.shippingemail || '',
      subDistrict: order.shippingsubdistrict || ''
    }

    return res.status(200).json({
      status: 200,
      data: mappedOrder
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({
      status: 500,
      message: 'Error fetching order',
      error: error.message
    })
  }
}
