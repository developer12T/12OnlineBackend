const { sequelize,DataTypes,QueryTypes } = require('../config/database');

const User = sequelize.define('data_user', {
    id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usercode: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  }, 
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  }, 
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loginAt: {
    type: DataTypes.STRING, 
    allowNull: true,
  },  


},{freezeTableName:true,timestamps:true,createdAt:true,updatedAt:true})

sequelize.sync({force:false,alter:false}) 

module.exports = { User };   