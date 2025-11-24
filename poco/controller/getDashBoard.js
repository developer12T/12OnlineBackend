const express = require('express');
const getDashboard = express.Router();
const multer = require('multer');
const moment = require('moment');
const { itemMaster } = require('../model/Itemmaster')
const { preItemMaster } = require('../model/Preitemmaster')
const { Op } = require('sequelize')
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH-mm-ss');
getDashboard.post('/getDashboard', async (req, res) => {
    try {
        
        const data = await preItemMaster.findAll({})
        const dataNull = await preItemMaster.findAll({where:{
            [Op.or]:{
                status:'0',
                statusActive12T:'0',
                statusActiveFplus:'0'
            }
        }}) 
        const dataActive = await preItemMaster.findAll({where:{
            [Op.and]:{
                status:'1',
                statusActive12T:'1',
                statusActiveFplus:'1'
            }
        }})
        const date = await itemMaster.findOne({
            attributes:['createdAt'],
            order: [['createdAt', 'DESC']]
        })
      
        res.status(200).json({count:data.length,datelast:date.createdAt.split("T")[0],countNull:dataNull.length,dataActive:dataActive.length});
    } catch (error) {
        console.log(error);
        res.status(400).json(error)
    }
})

module.exports = getDashboard;  