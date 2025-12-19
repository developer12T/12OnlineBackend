const axios = require('axios')
const { handleOrderPaid } = require('../services/webhook.service')

exports.getOrder = async (req, res) => {
  try {
    const { action } = req.params
    const payload = req.body

    console.log('Webhook action:', action)
    // console.log('Payload:', payload)

    switch (action) {
      case 'order_created':
        console.log('order_created')
        // handle order ใหม่
        await handleOrderCreated(payload)
        break

      case 'ship':
        console.log('order_paid')
        // handle ชำระเงิน
        await handleOrderPaid(payload)
        break

      case 'cancelled':
        console.log('order_cancelled')
        // handle ยกเลิก
        // await handleOrderCancelled(payload)
        break

      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown webhook action'
        })
    }

    // ต้องตอบ 200 / 201 ให้เร็ว
    res.status(200).json({ success: true, payload: payload })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ success: false })
  }
}

const TARGET_WEBHOOK_URL = 'http://localhost:8383/online/bento/webhook/ship'

exports.tigger = async (req, res) => {
  try {
    const { payload } = req.body
    // console.log(payload)

    const response = await axios.post(TARGET_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': 'mock-signature-123' // ถ้ายังไม่ verify ก็ใส่ไว้เฉยๆ
      },
      timeout: 5000
    })

    res.json({
      success: true,
      message: 'Webhook sent',
      webhookResponse: response.data
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
