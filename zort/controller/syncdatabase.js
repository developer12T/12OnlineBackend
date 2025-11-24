const express = require('express');
const syncstructure = express.Router();
const { sequelize } = require('../config/database')

syncstructure.post('/sync', async (req, res) => {

    const username = req.body.userName 
    const password = req.body.passWord 

    const useradmin = 'dev12T' 
    const passadmin = '12Trading' 

    try {

        // if (username === useradmin && password === passadmin) {
        //     sequelize.authenticate().then(async () => {
        //             await sequelize.sync({force:false,alter:false})  
        //         }).catch(err => {
        //             console.error('Failed connect to the database:', err)
        //         });
        //     res.json('SyncDatabase : -- Complete')
        // } else {
        //     res.json('SyncDatabase : -- Failed to sync don`t worry about me')
        // }

    } catch (error) {
            console.error('เกิดข้อผิดพลาด: ', error);
            res.json('เกิดข้อผิดพลาด')
    }
})

module.exports = syncstructure;  