const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
const mssql = require('mssql');

const connectM3 = {
  server: '192.168.2.74',
  database: process.env.databaseM3,
  user: 'sa',
  password: 'One2@@',
  options: {
    encrypt: false
  },
};

const sequelize = new Sequelize(process.env.databaseM3, 'sa', 'One2@@', {
// const sequelize = new Sequelize('M3FDBTST', 'sa', 'One2@@', {
    dialect: 'mssql',
    host: '192.168.2.74',
    schema: 'MVXJDTA',
    dialectOptions: {
        options: {
            enableArithAbort: false,
            encrypt: false,
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
                // minVersion: 'TLSv1_2'
            }
        }
    }
});

module.exports = {
    sequelize : sequelize,
    DataTypes: DataTypes,
    QueryTypes:QueryTypes, 
    mssql : mssql,
    connectM3 : connectM3
};