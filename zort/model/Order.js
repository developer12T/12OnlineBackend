const { sequelize, DataTypes } = require('../config/database');

const Order = sequelize.define('order', {
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
  cono: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
  invno: { type: DataTypes.STRING, allowNull: true, },
  ordertype: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  number: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  customerid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  customeriderp: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  warehousecode: { type: DataTypes.STRING, allowNull: true, },
  status: { type: DataTypes.STRING, allowNull: true, },
  paymentstatus: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  marketplacename: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  marketplaceshippingstatus: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  marketplacepayment: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  amount: { type: DataTypes.STRING, allowNull: true, },
  vatamount: { type: DataTypes.STRING, allowNull: true, },
  shippingvat: { type: DataTypes.STRING, allowNull: true, },
  shippingchannel: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingamount: { type: DataTypes.STRING, allowNull: true, },
  shippingdate: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingdateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingname: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingaddress: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingphone: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingemail: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingpostcode: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingprovince: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingdistrict: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingsubdistrict: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingstreetAddress: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  trackingno: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  orderdate: { type: DataTypes.STRING, allowNull: true, },
  orderdateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  paymentamount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  description: { type: DataTypes.STRING(500), collate: 'Thai_CI_AS', allowNull: true, },
  discount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  platformdiscount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  sellerdiscount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingdiscount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  discountamount: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  voucheramount: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  vattype: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  saleschannel: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  vatpercent: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  payments: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  isCOD: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  tag: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  createdatetime: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  createdatetimeString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  updatedatetime: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  updatedatetimeString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  expiredate: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  expiredateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  receivedate: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  receivedateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  trackingList: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  totalproductamount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  uniquenumber: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  properties: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  isDeposit: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  statusprint: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  totalprint: { type: DataTypes.INTEGER, collate: 'Thai_CI_AS', allowNull: true, },
  statusprintinv: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  statusPrininvSuccess: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, }
}, { freezeTableName: true, timestamps: false, createdAt: false, updatedAt: false });

const OrderDetail = sequelize.define('orderDetail', {
  auto_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  id: { type: DataTypes.INTEGER, allowNull: true, },
  numberOrder: { type: DataTypes.STRING, allowNull: true, },
  productid: { type: DataTypes.INTEGER, allowNull: true, },
  sku: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  name: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  procode: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  number: { type: DataTypes.INTEGER, allowNull: true, },
  unittext: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  pricepernumber: { type: DataTypes.FLOAT, allowNull: true, },
  discount: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  discountamount: { type: DataTypes.FLOAT, allowNull: true, },
  totalprice: { type: DataTypes.FLOAT, allowNull: true, },
  producttype: { type: DataTypes.FLOAT, allowNull: true, },
  serialnolist: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  expirylotlist: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  skutype: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleitemid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundlenumber: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleCode: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleName: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  integrationItemId: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  integrationVariantId: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
}, { freezeTableName: true, timestamps: false, createdAt: false, updatedAt: false, primaryKey: false })


const OrderHis = sequelize.define('orderSuccessInsM3', {
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
  cono: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
  invno: { type: DataTypes.STRING, allowNull: true, },
  ordertype: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  number: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  customerid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  customeriderp: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  warehousecode: { type: DataTypes.STRING, allowNull: true, },
  status: { type: DataTypes.STRING, allowNull: true, },
  paymentstatus: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  marketplacename: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  marketplaceshippingstatus: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  marketplacepayment: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  amount: { type: DataTypes.STRING, allowNull: true, },
  vatamount: { type: DataTypes.STRING, allowNull: true, },
  shippingvat: { type: DataTypes.STRING, allowNull: true, },
  shippingchannel: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingamount: { type: DataTypes.STRING, allowNull: true, },
  shippingdate: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingdateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingname: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingaddress: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingphone: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingemail: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingpostcode: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingprovince: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingdistrict: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingsubdistrict: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingstreetAddress: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  trackingno: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  orderdate: { type: DataTypes.STRING, allowNull: true, },
  orderdateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  paymentamount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  description: { type: DataTypes.STRING(500), collate: 'Thai_CI_AS', allowNull: true, },
  discount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  platformdiscount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  sellerdiscount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  shippingdiscount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  discountamount: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  voucheramount: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  vattype: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  saleschannel: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  vatpercent: { type: DataTypes.FLOAT, collate: 'Thai_CI_AS', allowNull: true, },
  payments: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  isCOD: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  tag: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  createdatetime: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  createdatetimeString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  updatedatetime: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  updatedatetimeString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  expiredate: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  expiredateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  receivedate: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  receivedateString: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  trackingList: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  totalproductamount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  uniquenumber: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  properties: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  isDeposit: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  statusprint: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  totalprint: { type: DataTypes.INTEGER, collate: 'Thai_CI_AS', allowNull: true, },
  statusprintinv: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  statusPrininvSuccess: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, }
}, { freezeTableName: true, timestamps: false, createdAt: false, updatedAt: false });


const OrderDetailHis = sequelize.define('orderDetailSuccessInsM3', {
  auto_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  id: { type: DataTypes.INTEGER, allowNull: true, },
  numberOrder: { type: DataTypes.STRING, allowNull: true, },
  productid: { type: DataTypes.INTEGER, allowNull: true, },
  sku: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  name: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  procode: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  number: { type: DataTypes.INTEGER, allowNull: true, },
  unittext: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  pricepernumber: { type: DataTypes.FLOAT, allowNull: true, },
  discount: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  discountamount: { type: DataTypes.FLOAT, allowNull: true, },
  totalprice: { type: DataTypes.FLOAT, allowNull: true, },
  producttype: { type: DataTypes.FLOAT, allowNull: true, },
  serialnolist: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  expirylotlist: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  skutype: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleitemid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundlenumber: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleCode: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  bundleName: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  integrationItemId: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
  integrationVariantId: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
}, { freezeTableName: true, timestamps: false, createdAt: false, updatedAt: false, primaryKey: false })

const LogOrderInSuccessM3 = sequelize.define('logOrderInSuccessM3', {
  runId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  setNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  cono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  invno: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cuscode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numberOrderRef: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerid: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateInsert: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  freezeTableName: true,
  timestamps: false
});


Order.hasMany(OrderDetail, {
  foreignKey: 'id',
  targetKey: 'id',
});

OrderHis.hasMany(OrderDetailHis, {
  foreignKey: 'id',
  targetKey: 'id',
});

// sequelize.sync({force:false,alter:false}) 
module.exports = { Order, OrderDetail, OrderHis, OrderDetailHis, LogOrderInSuccessM3 };
