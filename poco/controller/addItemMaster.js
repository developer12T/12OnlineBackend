const express = require('express');
const addItemMaster = express.Router();
const multer = require('multer');
const moment = require('moment');
const { itemMaster } = require('../model/Itemmaster')
const { preItemMaster } = require('../model/Preitemmaster')
const { Op } = require('sequelize')
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH-mm-ss');
addItemMaster.post('/addItemMaster', async (req, res) => {
    try {
        
        const data = await preItemMaster.findAll({})
        await itemMaster.destroy({truncate:true})
        for (const item of data) {
            await itemMaster.create({
                id: item.id,
                channel: item.channel,
                group:item.group,
                productId:item.productId,
                productName:item.productName ,
                pricePerCTN: item.pricePerCTN,
                status: item.status ,
                statusActive12T:item.statusActive12T ,
                statusActiveFplus: item.statusActiveFplus,
                createdAt:currentDate , 
                updatedAt:currentDate ,
            });
        }
        await preItemMaster.destroy({truncate:true})
        res.status(200).json({count:data.length,list:data});
    } catch (error) {
        console.log(error);
        res.status(400).json(error)
    }
})

module.exports = addItemMaster;  