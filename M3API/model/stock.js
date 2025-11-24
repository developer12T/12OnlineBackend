const { sequelize,DataTypes } = require('../config/dbconnect');

const Stock = sequelize.define('MITLOC', {
  companycode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'MLCONO'
    },
    warehouse: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'MLWHLO'
    },
    itemcode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'MLITNO'
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'MLWHSL'
    },
    lot: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'MLBANO'
    },
    balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'MLSTQT'
    },
    allocated: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'MLALQT'
    }
  },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey:false});

  const StockAll = sequelize.define('MITBAL', {
    companycode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'MBCONO'
      },
      warehouse: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'MBWHLO'
      },
      itemcode: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'MBITNO'
      },
      balance: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'MBSTQT'
      },
      allocated: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'MBALQT'
      }
    },{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false,primaryKey:false});

  // Item.hasMany(Stock);
  // Stock.belongsTo(Item);

  module.exports = {
    Stock,
    StockAll
};