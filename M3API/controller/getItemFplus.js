const express = require("express");
const getItemFplus = express.Router();
// const { Item, ItemConvert } = require("../model/Item");
// const { Op } = require("sequelize");
const { sequelize } = require('../config/dbconnectFplus')
getItemFplus.post("/getItemFplus", async (req, res) => {
  try {
    // const data = await Item.findAll({
    //   attributes: { exclude: ["id"] },
    // });

    const query = `SELECT MMCONO AS companycode,MMSTAT AS status,MMITNO AS itemcode,MMFUDS AS itemname,MMITTY AS itemtype,MMCFI3 AS itemgroup FROM [MVXJDTA].[MITMAS] `;

    const replacements = {}
  const result = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
  }); 
    res.json(result);
  } catch (error) {
    console.error(error);
    res.json(error);
  }
}),

 

module.exports = getItemFplus;
