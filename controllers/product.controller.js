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
    const token = await getAccessToken()
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
    // for (const items of products) {
    //   for (const item of items.product_variant) {
    //     await Product.updateOne(
    //       { product_variant_id: item.product_variant_id }, // filter
    //       {
    //         $set: {
    //           product_variant_id: item.product_variant_id,
    //           product_id: item.product_id,
    //           product_name: item.product_name,
    //           sku: item.sku,
    //           name: item.name,
    //           group_id: items.product_id,
    //           group: items.name,
    //           store_id: item.store_id,
    //           type: item.type,
    //           price: item.price,
    //           stock: item.stock,
    //           weight: items.weight,
    //           selling_price: items.selling_price,
    //           is_sold_out: items.is_sold_out,
    //           active: items.active,
    //           thumb: items.thumb,
    //           image: items.image,
    //           product_thumb: items.product_thumb,
    //           product_image: items.product_image
    //           //   product_variant: item.product_variant || []
    //         }
    //       },
    //       { upsert: true }
    //     )
    //   }
    // }
    for (const product of products) {
      const variants = product.product_variant || []

      for (const item of variants) {
        await Product.updateOne(
          { product_variant_id: item.product_variant_id },
          {
            $set: {
              // product-level
              product_id: product.id,
              group_id: product.product_id,
              group: product.name,
              weight: product.weight,
              selling_price: product.selling_price,
              store_id: item.store_id,
              is_sold_out: product.is_sold_out,
              active: product.active,
              thumb: product.thumb,
              image: product.image,
              product_thumb: product.product_thumb,
              product_image: product.product_image,
              // variant-level
              product_variant_id: item.product_variant_id,
              product_id: item.product_id,
              product_name: item.product_name,
              sku: item.sku,
              name: item.name,
              type: item.type,
              price: item.price,
              seq: item.seq,
              stock: item.stock
            }
          },
          { upsert: true }
        )
      }
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
