const express = require('express');
const deletePreItem = express.Router();
const moment = require('moment');
const { itemMaster } = require('../model/Itemmaster')
const { preItemMaster } = require('../model/Preitemmaster')
const { Op } = require('sequelize')
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH-mm-ss');
deletePreItem.post('/deletePreItem', async (req, res) => {
    try {
        await preItemMaster.destroy({truncate:true}) ;
        res.status(200).json('success');
    } catch (error) {
        console.log(error);
        res.status(400).json(error)
    }
})
 
module.exports = deletePreItem;   