const mongoose = require('mongoose')

const listOrderProductSchema = new mongoose.Schema({
  itemNumber: { type: Number },
  id: { type: Number },
  productid: { type: Number },
  procode: { type: String },
  sku: { type: String },
  itemCode: { type: String },
  unit: { type: String },
  name: { type: String },
  quantity: { type: Number },
  discount: { type: Number },
  discountChanel: { type: String },
  pricePerUnitOri: { type: Number },
  pricePerUnit: { type: Number },
  totalprice: { type: Number }
})

const orderSchema = new mongoose.Schema(
  {
    // orderId: {
    //   type: String,
    //   required: true,
    //   unique: true
    // },
    id: { type: String, unique: true },
    cono: { type: String, default: '' },
    invno: { type: String, default: '' },
    ordertype: { type: String },
    number: { type: String },
    customerid: { type: String },
    customername: { type: String },
    customercode: { type: String },
    customeridnumber: { type: String },
    warehousecode: { type: String },
    status: { type: String },
    paymentstatus: { type: String },
    marketplacename: { type: String },
    marketplaceshippingstatus: { type: String },
    marketplacepayment: { type: String },
    shippingvat: { type: Number },
    shippingchannel: { type: String },
    shippingamount: { type: Number },
    shippingdate: { type: String },
    shippingdateString: { type: String },
    shippingname: { type: String },
    shippingaddress: { type: String },
    shippingphone: { type: String },
    shippingemail: { type: String },
    shippingpostcode: { type: String },
    shippingprovince: { type: String },
    shippingdistrict: { type: String },
    shippingsubdistrict: { type: String },
    shippingstreetAddress: { type: String },
    orderdate: { type: String },
    orderdateString: { type: String },
    paymentamount: { type: Number, default: 0 },
    description: { type: String },
    discount: { type: Number },
    discountamount: { type: Number },
    voucheramount: { type: Number },
    platformdiscount_pretax: { type: Number },
    platformdiscount_vat: { type: Number },
    platformdiscount: { type: Number },
    sellerdiscount: { type: Number },
    saleschannel: { type: String },
    shippingamount_pretax: { type: Number },
    shippingamount_vat: { type: Number },
    vattype: { type: Number },
    vatpercent: { type: Number },
    isCOD: { type: String },
    createdatetime: { type: String },
    createdatetimeString: { type: String },
    updatedatetime: { type: String },
    updatedatetimeString: { type: String },
    amount: { type: Number },
    vatamount: { type: Number },
    totalproductamount: { type: Number },
    currency: { type: String },
    statusprint: { type: String, default: '' },
    totalprint: { type: Number },
    statusprintinv: { type: String, default: '' },
    statusPrininvSuccess: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    listProduct: [listOrderProductSchema]
  },
  {
    timestamps: true
  }
)

// const Order = dbCA.model('Order', orderSchema)
// module.exports = { Order }

module.exports = conn => {
  return {
    Order: conn.model('Order', orderSchema)
  }
}
