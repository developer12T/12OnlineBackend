const mongoose = require('mongoose')

const shippingSchema = new mongoose.Schema(
  {
    shi_customerid: { type: String, default:''},
    order_id: { type: String },
    shippingname: { type: String },
    shippingaddress: { type: String },
    shippingphone: { type: String },
    shippingemail: { type: String },
    shippingpostcode: { type: String },
    shippingprovince: { type: String },
    shippingdistrict: { type: String },
    shippingsubdistrict: { type: String },
    shippingstreetAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

  },
  {
    timestamps: true
  }
)

module.exports = conn => {
  return {
    ShippingMongo: conn.model('shippingMongo', shippingSchema,'shippingMongo')
  }
}
