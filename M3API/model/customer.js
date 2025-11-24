const { sequelize,DataTypes } = require('../config/dbconnect');

const Customer = sequelize.define('OCUSMA', {
    companycode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'OKCONO'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKSTAT'
    },
    customertype: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUCL'
    },
    customercode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUNO'
    },
    customername: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUNM'
    },
    customername2: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUA4'
    },
    addressid: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKADID'
    },
    address1: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUA1'
    },
    address2: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUA2'
    },
    address3: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCUA3'
    },
    postcode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKPONO'
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKPHNO'
    },
    salecode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKSMCD'
    },
    ordertype: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKORTP'
    },
    warehouse: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKWHLO'
    },
    zone: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKSDST'
    },
    area: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCFC1'
    },
    team: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCFC8'
    },
    duocode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCFC9'
    },
    route: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKCFC8'
    },
    payer: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKPYNO'
    },
    taxno: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OKVRNO'
    }
  },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey:false});


module.exports = {
    Customer,
};