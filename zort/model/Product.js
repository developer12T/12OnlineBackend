const { sequelize, DataTypes } = require('../config/database');

const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, },
    producttype: { type: DataTypes.INTEGER, allowNull: true, },
    name: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    sku: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    sellprice: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    purchaseprice: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    stock: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    availablestock: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    unittext: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    // imagepath:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    weight: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    height: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    length: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    width: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    categoryid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    category: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    variationid: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    variant: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    tag: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    sharelink: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    active: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },
    properties: { type: DataTypes.STRING, collate: 'Thai_CI_AS', allowNull: true, },


}, { freezeTableName: true, timestamps: false, createdAt: false, updatedAt: false })

// OrderDetail.belongsTo(Order);  
// Order.hasOne(OrderDetail);  

// sequelize.sync({force:false,alter:false})  
module.exports = { Product };