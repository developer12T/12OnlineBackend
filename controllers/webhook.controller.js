const axios = require('axios')
const { handleOrderPaid } = require('../services/webhook.service')

exports.getOrder = async (req, res) => {
  try {
    const { action } = req.params
    const payload = req.body

    console.log('Webhook action:', action)
    console.log('Payload:', payload)

    switch (action) {
      case 'order_created':
        console.log('order_created')
        // handle order ใหม่
        // await handleOrderCreated(payload)
        break

      case 'order_paid':
        console.log('order_paid')
        // handle ชำระเงิน
        await handleOrderPaid(payload)
        break

      case 'order_cancelled':
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
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ success: false })
  }
}

const TARGET_WEBHOOK_URL =
  'http://localhost:8383/online/bento/webhook/order_paid'

exports.tigger = async (req, res) => {
  try {
    const payload = {
      id: 258078337,
      number: '2511063548NE6A',
      customerid: 60351816,
      customername: 'ขายช่องทาง Shopee',
      customercode: 'OSPE000000',
      warehousecode: 'W0001',
      status: 'Pending',
      paymentstatus: 'Paid',
      saleschannel: 'Shopee',
      amount: 543,
      vatamount: 35.53,
      currency: 'THB',
      updatedatetime: '2025-11-06T13:10:55',
      list: [
        {
          itemNumber: 1,
          sku: '10010702005_CRT',
          name: 'FaThai ซอสต้มยำ',
          quantity: 2,
          pricePerUnit: 239,
          totalprice: 478
        },
        {
          itemNumber: 4,
          sku: 'ZNS1401001_JOB',
          unit: 'JOB',
          name: 'ค่าขนส่ง',
          quantity: 1,
          pricePerUnit: 75,
          totalprice: 75
        }
      ]
    }

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
