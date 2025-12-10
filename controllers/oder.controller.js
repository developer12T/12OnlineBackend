const { getAccessToken } = require('../services/oauth.service')
const axios = require('axios')

exports.getOrder = async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      message: 'Successful!',
      data: 'TEST Success'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}

exports.getOrderBento = async (req, res) => {
  try {
    const { action, langs, limit, date_created_start, date_created_end } =
      req.query
    const token = await getAccessToken()

    const response = await axios.get(
      `${process.env.BENTO_ORDER_URL}/order/list/${process.env.CLIENT_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          action,
          langs,
          limit,
          date_created_start,
          date_created_end
        }
      }
    )

    res.json(response.data)
    // res.json("TEST")
  } catch (err) {
    console.error('Error get order:', err.response?.data || err.message)
    res.status(500).json({ message: 'Failed to get order' })
  }
}

exports.insert = async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      message: 'Successful!',
      data: 'TEST Success'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}

exports.removeOrder = async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      message: 'Successful!',
      data: 'TEST Success'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ status: '500', message: error.message })
  }
}
