const { sequelize,DataTypes } = require('../config/database') ;

const itemMaster = sequelize.define('ItemMaster', {
    id:{ type: DataTypes.INTEGER,allowNull: false,primaryKey: true,autoIncrement: false},
    channel: { type: DataTypes.STRING,allowNull: true},
    group: { type: DataTypes.STRING,allowNull: true},
    productId: { type: DataTypes.STRING,allowNull: true},
    productName: { type: DataTypes.STRING,allowNull: true},
    pricePerCTN:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    status:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    statusActive12T:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    statusActiveFplus:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    createdAt:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    updatedAt:{type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
   
},{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false})
 
// sequelize.sync({force:false,alter:false})  
 
module.exports = { itemMaster };
