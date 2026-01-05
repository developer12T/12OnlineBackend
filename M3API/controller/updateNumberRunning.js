// const express = require("express");
// const updateNumberRunning = express.Router();
const { NumberSeries, NumberSeriesINV } = require("../model/order");
const { Op } = require('sequelize');

async function updateNumberRunning({
  lastno,
  series,
  seriesname,
  seriestype,
  companycode
}) {
  try {
    const update = await NumberSeries.update(
      { lastno: lastno },
      {
        where: {
          [Op.or]: [
            {
              companycode: companycode,
              series: series,
              seriestype: seriestype,
            },
            {
              seriesname: {
                [Op.like]: `%${seriesname}%`,
              }
            }
          ]
        }
      }
    )

    return { LastNumber: lastno }
  } catch (error) {
    throw error
  }
}

 async function updateNumberRunningINV({
  lastno,
  series,
  seriesname,
  seriesyear,
  companycode
}) {
  try {
    const update = await NumberSeriesINV.update(
      { lastno: lastno },
      {
        where: {
          [Op.or]: [
            {
              companycode: companycode,
              series: series,
              seriesyear: seriesyear,
            },
            {
              seriesname: {
                [Op.like]: `%${seriesname}%`,
              }
            }
          ]
        }
      }
    )

    return { LastNumber: lastno }
  } catch (error) {
    throw error
  }
}

module.exports = {
  updateNumberRunning,updateNumberRunningINV
}
