const express = require("express");
const getItem = express.Router();
const { Item, ItemConvert } = require("../model/Item");
const { Op } = require("sequelize");

getItem.post("/getItem", async (req, res) => {
  const itcode = req.body.itemcode
  try {
    if(itcode === null || itcode === '' || itcode === undefined){
      const data = await Item.findAll({
        attributes: { exclude: ["id"] },
      });
      res.json(data);
    }else{
      const data = await Item.findAll({
        attributes: { exclude: ["id"] },
        where:{itemcode:itcode}
      });
      res.json(data);
    }
  } catch (error) {
    console.error(error);
    res.json(error);
  }
}),

  getItem.post("/getItemConvert", async (req, res) => {
    try {
      const arrItem = [] ;

      const data = await ItemConvert.findAll({
        attributes: { exclude: ["id"] },
        where: {
            [Op.and]: [
              { MUCONO: 410 },
              { MUAUTP: 1 }
            ]
          }
      });
    
      for (let i = 0; i < data.length; i++) {
        const trimmedData = data[i].itemcode.trim();
        console.log(trimmedData);
      
        let existingObj = arrItem.find((item) => item.itemcode === trimmedData);
      
        if (!existingObj) {
          existingObj = {
            itemcode: trimmedData,
            type: [],
          };
          arrItem.push(existingObj);
        }
      
        existingObj.type.push({
          factor: data[i].factor,
          unit: data[i].unit,
         
        });
      }
      res.json(arrItem);
      
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  });

getItem.post("/getItemDisOnline", async (req, res) => {
    try {
      const comcode = req.body.companycode
      const itemtype = req.body.itemtype
      const itemcode = req.body.itemcode
      const data = await Item.findAll({
        attributes: { exclude: ["id"] },
        where:{
          companycode:410,
          itemcode: {
            [Op.like]: `%${itemcode}%`,
          },
          itemtype:itemtype
        }
      });
      res.json(data);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  }),

  getItem.post("/getItemConvertItemcode", async (req, res) => {
    const itcode = req.body.itcode
    try {
      const arrItem = [] ;

      const data = await ItemConvert.findAll({
        attributes: { exclude: ["id"] },
        where: {
            [Op.and]: [
              { MUCONO: 410 },
              { MUAUTP: 1 },
              {itemcode:itcode}
            ]
          }
      });
    
      for (let i = 0; i < data.length; i++) {
        const trimmedData = data[i].itemcode.trim();
        console.log(trimmedData);
      
        let existingObj = arrItem.find((item) => item.itemcode === trimmedData);
      
        if (!existingObj) {
          existingObj = {
            itemcode: trimmedData,
            type: [],
          };
          arrItem.push(existingObj);
        }
      
        existingObj.type.push({
          factor: data[i].factor,
          unit: data[i].unit,
         
        });
      }
      res.json(arrItem);
      
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  });

module.exports = getItem;
