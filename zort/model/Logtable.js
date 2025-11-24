const { sequelize,DataTypes } = require('../config/database') ;

const  logTable = sequelize.define('logTable', {
    id: { type: DataTypes.INTEGER,allowNull: true,primaryKey: true,autoIncrement: true},
    number: { type: DataTypes.STRING,allowNull: true,},
    action: {type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    action1: {type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    action2: {type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    action3: {type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
    createdAt: {type: DataTypes.STRING,collate: 'Thai_CI_AS',allowNull: true,},
  },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey: false})

  module.exports = { logTable };