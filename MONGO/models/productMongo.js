const mongoose = require('mongoose')
// const { CA_DB_URI_UAT } = require('../../config/mongoDb')



const productSchema = mongoose.Schema({
    id: { type: String, require: true },
    producttype: { type: String },
    name:{ type: String },
    sku: { type: String, require: true },
    sellprice: { type: Number, require: true },
    purchaseprice: { type: Number, require: true },
    stock: { type: Number, require: true },
    availablestock: { type: Number, require: true },
    unittext: { type: String, require: true },
    weight: { type: Number, require: true },
    height : { type: Number ,default: 0},
    length: { type: Number, require: true },
    width: { type: Number, require: true },
    categoryid: { type: String, require: true },
    category: { type: Number, require: true, default: 0 },
    variationid: { type: Number, require: true, default: 0 },
    variant: { type: String, require: true },
    tag: { type: String, require: true },
    sharelink: { type: String, require: true },
    active: { type: String, require: true },
    properties: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})



module.exports = (conn) => {
    return {
        Product: conn.model('Product', productSchema),
    };
};