const { Sequelize,DataTypes,QueryTypes } = require('sequelize');
const mssql = require('mssql');

const connectM3 = {
  server: '192.168.0.74',
  database: 'F@753951',
  user: 'sa',
  password: 'One2@@',
  options: {
    encrypt: false
  },
};

const sequelize = new Sequelize('M3FDBTST', 'sa', 'F@753951', {
// const sequelize = new Sequelize('M3FDBTST', 'sa', 'One2@@', {
    dialect: 'mssql',
    host: '192.168.0.74',
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