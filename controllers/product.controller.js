const { getAccessToken } = require('../services/oauth.service')
const axios = require('axios')
const Product = require('../model/product')

exports.sysnceProductBento = async (req, res) => {
  try {
    const { action, langs, limit, date_created_start, date_created_end } =
      req.query
    const token = await getAccessToken()
    console.log(
      `${process.env.BENTO_STORE_URL}/productlist?store_id=${process.env.CLIENT_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          limit
        }
      }
    )

    const response = await axios.get(
      `${process.env.BENTO_STORE_URL}/productlist?store_id=${process.env.CLIENT_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          action,
          langs,
          limit
        }
      }
    )

    res.json(response.data)
    // res.json("TEST")
  } catch (err) {
    console.error(
      'Error get sysnceProductBento:',
      err.response?.data || err.message
    )
    res.status(500).json({ message: 'Failed to sysnceProductBento' })
  }
}
