const { sequelize,DataTypes } = require('../config/database') ;

const userPoco = sequelize.define('user', {
    Id:{ type: DataTypes.INTEGER,allowNull: false,primaryKey: true,autoIncrement: true},
    userId: { type: DataTypes.STRING,allowNull: true},
    warehouse: { type: DataTypes.STRING,allowNull: true},
    role: { type: DataTypes.STRING,allowNull: true},
    status: { type: DataTypes.STRING,allowNull: true},
    loginAt: { type: DataTypes.STRING,allowNull: true},
    token: { type: DataTypes.STRING,allowNull: true},

},{freezeTableName:true,timestamps:false,createdAt:false,updatedAt:false})
 
// sequelize.sync({force:false,alter:false})  
 
module.exports = { userPoco };
