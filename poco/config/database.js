const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(process.env.databasepoco, process.env.user, process.env.password, {
  dialect: process.env.dialact,
  host: process.env.server,
});

module.exports = {
    sequelize: sequelize,
    DataTypes: DataTypes,
    QueryTypes:QueryTypes
};
   