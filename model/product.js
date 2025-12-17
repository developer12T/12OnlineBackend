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


const productSchema = new mongoose.Schema({
  id: { type: Number },
  store_id: { type: Number },
  name: { type: String },
  type: { type: Number },
  price: { type: Number },
  selling_price: { type: Number },
  weight: { type: Number },
  is_sold_out: { type: Boolean },
  active: { type: Boolean },
  thumb: { type: String },
  image: { type: String },
  //   category: { type: String },
  thumb: { type: String },
  product_variant: [listProductVariantSchema]
})


module.exports = conn => {
  return {
    Product: conn.model('Product', productSchema)
  }
}
