const mongoose = require('mongoose')

const listProductVariantSchema = new mongoose.Schema({
  product_variant_id: { type: Number },
  product_id: { type: Number },
  product_name: { type: String },
  name: { type: String },
  sku: { type: String },
  barcode: { type: String },
  price: { type: Number },
  seq: { type: Number },
  updated_at: { type: String }
})


// const listProductVariantSchema = new mongoose.Schema({
//   product_variant_id: { type: Number },
//   product_id: { type: Number },

//   name: { type: String },

//   updated_at: { type: String }
// })

const productSchema = new mongoose.Schema(
  {
    product_variant_id: { type: Number },
    product_id: { type: Number, index: true }, // แนะนำให้มี index
    group_id: { type: Number, index: true }, // แนะนำให้มี index
    product_name: { type: String },
    store_id: { type: Number, index: true },
    group: { type: String },
    sku: { type: String },
    type: { type: Number },
    price: { type: Number },
    stock: { type: Number },
    real_stock: { type: Number },
    selling_price: { type: Number },
    weight: { type: Number },
    is_sold_out: { type: Boolean },
    active: { type: Boolean },
    thumb: { type: String },
    barcode_type: { type: Number },
    barcode: { type: String },
    image: { type: String },
    barcode: { type: String },
    product_thumb: { type: String },
    product_image: { type: String },
    // price: { type: Number },
    seq: { type: Number }
    // product_variant: [listProductVariantSchema]
  },
  {
    timestamps: true
  }
)

module.exports = conn => {
  return {
    Product: conn.model('Product', productSchema, 'product')
  }
}
