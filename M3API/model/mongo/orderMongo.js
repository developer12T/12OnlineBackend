const mongoose = require('mongoose')
const { dbCA } = require('../../config/db')


const listOrderProductSchema = new mongoose.Schema({
  auto_id :{ type: String },
  id: { type: String },
  productid: { type: String },
  name: { type: String },
  procode: { type: String },
  number: { type: String },
  unittext: { type: String },
  pricepernumber: { type: Number },
  discount: { type: Number },
  discountamount: { type: Number },
  totalprice: { type: Number },
  producttype: { type: String },
  serialnolist: { type: String },
  expirylotlist: { type: String },
  skutype: { type: String },
  bundleid: { type: String },
  bundleitemid: { type: String },
  bundlenumber: { type: String },
  bundleCode: { type: String },
  bundleName: { type: String },
  integrationItemId: { type: String },
  integrationVariantId:{ type: String },
  numberOrder:{ type: String },
})


const orderSchema = new mongoose.Schema(
  {
    id: { type: String },
    cono: { type: String },
    invno: { type: String },
    ordertype: { type: String },
    number: { type: String },
    customerid: { type: String },
    customeriderp: { type: String },
    warehousecode: { type: String },
    status: { type: String },
    paymentstatus: { type: String },
    marketplacename: { type: String },
    marketplaceshippingstatus: { type: String },
    marketplacepayment: { type: String },
    listProduct : [listOrderProductSchema] ,
    amount: { type: Number },
    vatamount : { type: Number },
    shippingvat : { type: Number },
    shippingchannel : { type: String },
    shippingamount : { type: Number },
    shippingdate : { type: String },
    shippingdateString : { type: String },
    shippingname : { type: String,  },
    shippingaddress : { type: String,  },
    shippingphone : { type: String,  },
    shippingemail : { type: String,  },
    shippingpostcode : { type: String,  },
    shippingprovince : { type: String,  },
    shippingdistrict : { type: String,  },
    shippingsubdistrict : { type: String,  },
    shippingstreetAddress : { type: String,  },
    trackingno : { type: String,  },
    orderdate : { type: String,  },
    orderdateString : { type: String,  },
    paymentamount : { type: Number },
    description : { type: String,  },
    discount : { type: Number },
    platformdiscount : { type: Number },
    sellerdiscount : { type: Number },
    shippingdiscount : { type: Number },
    discountamount : { type: Number },
    voucheramount : { type: Number },
    vattype : { type: String },
    saleschannel : { type: String },
    vatpercent : { type: Number },
    payments : { type: String,  },
    isCOD : { type: String,  },
    tag : { type: String,  },
    createdatetime : { type: String,  },
    createdatetimeString : { type: String,  },
    updatedatetime : { type: String,  },
    updatedatetimeString : { type: String,  },
    expiredate : { type: String,  },
    expiredateString : { type: String,  },
    receivedate : { type: String,  },
    receivedateString : { type: String,  },
    trackingList : { type: String,  },
    totalproductamount : { type: Number },
    uniquenumber : { type: String,  },
    properties : { type: String,  },
    isDeposit : { type: String,  },
    statusprint : { type: String,  },
    totalprint : { type: Number },
    statusprintinv : { type: String },
    statusPrininvSuccess : { type: String },



    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

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
