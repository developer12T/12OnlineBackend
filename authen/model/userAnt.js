const { Sequelize,DataTypes,QueryTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.databaseant, process.env.userAntDB,  process.env.passAntDB, {
  dialect: process.env.dialact,
  host: process.env.serverAnt,
});

const UserAnt = sequelize.define('hs_User_test', {
    Col_LoginName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Col_PWord: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Col_Name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Col_o_JobTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Col_DeptInfo: {
    type: DataTypes.STRING,
    allowNull: false,
  },


},{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false})

// sequelize.sync({force:false,alter:false}) 

module.exports = { UserAnt };   