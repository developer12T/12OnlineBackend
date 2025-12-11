const { getAccessToken } = require('../services/oauth.service')
const axios = require('axios')
const productModel = require('../model/product')
const { getModelsByChannel } = require('../authen/middleware/channel')


exports.sysnceProductBento = async (req, res) => {
  try {
    const { action, langs, limit, date_created_start, date_created_end } =
      req.query
    const channel = req.headers['x-channel']
    const { Product } = getModelsByChannel(channel, res, productModel)
    console.log(channel)

    const token = await getAccessToken()
    // console.log(
    //   `${process.env.BENTO_STORE_URL}/productlist?store_id=${process.env.CLIENT_ID}`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${token}`
    //     },
    //     params: {
    //       limit
    //     }
    //   }
    // )

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

    const products = response.data?.data?.product_list || []

    // -----------------------------
    // INSERT / UPDATE TO MONGO
    // -----------------------------
    for (const item of products) {
      await Product.updateOne(
        { product_id: item.product_id }, // filter
        {
          $set: {
            product_id: item.product_id,
            store_id: item.store_id,
            name: item.name,
            type: item.type,
            price: item.price,
            selling_price: item.selling_price,
            weight: item.weight,
            is_sold_out: item.is_sold_out,
            active: item.active,
            thumb: item.thumb,
            image: item.image,
            product_variant: item.product_variant || []
          }
        },
        { upsert: true }
      )
    }

    // -------------------------------------------
    // 🔥 AUTO REMOVE OBSOLETE PRODUCTS
    // -------------------------------------------

    const bentoIds = products.map(p => p.id)

    // ลบสินค้าที่ไม่มีใน Bento แล้ว
    await Product.deleteMany({
      id: { $nin: bentoIds }
    })

    return res.status(200).json({
      status: 'success',
      message: 'Products synced & obsolete removed',
      insertedOrUpdated: products
    })

    // res.json("TEST")
  } catch (err) {
    console.error(
      'Error get sysnceProductBento:',
      err.response?.data || err.message
    )
    res.status(500).json({ message: 'Failed to sysnceProductBento' })
  }
}
