const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema(
  {
    customerid: { type: String, default:''},
    customeriderp: { type: String },
    customername: { type: String },
    customercode: { type: String },
    customeridnumber: { type: String },
    customeremail: { type: String },
    customerphone: { type: String },
    customeraddress: { type: String },
    customerpostcode: { type: String },
    customerprovince: { type: String },
    customerdistrict: { type: String },
    customersubdistrict: { type: String },
    customerstreetAddress: { type: String },
    customerbranchname: { type : String} ,
    customerbranchno : { type : String} ,
    facebookname : { type : String} ,
    facebookid : { type : String} ,
    line : { type : String} ,
    lineid : { type : String} ,
    createddate : { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

  },
  {
    timestamps: true
  }
)

module.exports = conn => {
  return {
    Customer: conn.model('customer', customerSchema,'customer')
  }
}
