const express = require('express');
const getItem = express.Router();
const multer = require('multer');
const moment = require('moment');
const { itemMaster } = require('../model/Itemmaster')
const { preItemMaster } = require('../model/Preitemmaster')
const { Op } = require('sequelize')
const currentDate = moment().utcOffset(7).format('YYYY-MM-DDTHH-mm-ss');
getItem.post('/getItem', async (req, res) => {
    const tab = req.body.tab
    try {

    
        if(tab === 'all'){
            var data = await itemMaster.findAll({})
        }else{
            var data = await itemMaster.findAll({where:{channel:tab}})
        }

        data.sort((a, b) => {
            if (!a.statusActive12T || !b.statusActive12T) {
              if (!a.statusActive12T && !b.statusActive12T) {
                if (!a.statusActiveFplus || !b.statusActiveFplus) {
                  if (!a.statusActiveFplus && !b.statusActiveFplus) {
                    return a.pricePerCTN - b.pricePerCTN;
                  }
                  return a.statusActiveFplus ? -1 : 1;
                }
                return !a.statusActiveFplus ? -1 : 1;
              }
              return !a.statusActive12T ? -1 : 1;
            }
            
            if (a.statusActive12T !== b.statusActive12T) {
              return a.statusActive12T ? -1 : 1;
            }
            if (a.statusActiveFplus !== b.statusActiveFplus) {
              return a.statusActiveFplus ? -1 : 1;
            }
            return a.pricePerCTN - b.pricePerCTN;
          });

        const date = await itemMaster.findOne({
            attributes:['createdAt'],
            order: [['createdAt', 'DESC']]
        })

        if(date !== null){
          var  date2 = date.createdAt
        }else{
           var  date2 = '----/--/--'
        }
      
        res.status(200).json({count:data.length,datelast:date2.split("T")[0],list:data});
    } catch (error) {
        console.log(error);
        res.status(400).json(error)
    }
})

module.exports = getItem;  