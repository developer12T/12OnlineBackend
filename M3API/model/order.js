const { sequelize,DataTypes } = require('../config/dbconnect');

const NumberSeries = sequelize.define('CSYNBR', {
    companycode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'CNCONO'
    },
    series: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'CNNBID'
    },
    seriestype: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'CNNBTY'
    },
    seriesname: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'CNNBDE'
    },
    startno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'CNNBLO'
    },
    finalno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'CNNBHI'
    },
    lastno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'CNNBNR'
    }
  },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey:false});

const NumberSeriesINV = sequelize.define('CSYNBI', {
    companycode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'C2CONO'
    },
    series: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'C2NBID'
    },
    seriesyear: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'C2YEA4'
    },
    seriesname: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'C2NBDE'
    },
    prefixno: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'C2INPX'
    },
    startno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'C2NBLO'
    },
    finalno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'C2NBHI'
    },
    lastno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'C2NBNR'
    }
  },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey:false});

const COHead = sequelize.define('OOHEAD', {
    companycode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'OACONO'
    },
    orderno: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAORNO'
    },
    ordertype: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAORTP'
    },
    warehouse: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAWHLO'
    },
    lowsts: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAORST'
    },
    highsts: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAORSL'
    },
    customercode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OACUNO'
    },
    orderdate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'OAORDT'
    },
    senddate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'OARLDT'
    },
    addresscode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAADID'
    },
    salecode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OASMCD'
    },
    orderref: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAOREF'
    },
    ordernote: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAYREF'
    },
    payer: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OAPYNO'
    },
    grossweight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'OAGRWE'
    },
    netweight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'OAGRWE'
    },
    ordervalue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'OANTLA'
    },
    customerordno: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'OACUOR'
    }
  },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey:false});

  module.exports = {
    NumberSeries,
    NumberSeriesINV,
    COHead
};