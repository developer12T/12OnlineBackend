const express = require("express");
const updateNumberRunning = express.Router();
const { NumberSeries, NumberSeriesINV } = require("../model/order");
const { Op } = require('sequelize');

updateNumberRunning.post("/updateNumberRunning", async (req, res) => {
    const lastno = req.body.lastno
    const series = req.body.series
    const seriesname = req.body.seriesname
    const seriestype = req.body.seriestype
    const companycode = req.body.companycode
    try {
       const update = await NumberSeries.update({lastno:lastno},{ 
        where: {
        [Op.or]: [
          {
            companycode: companycode,
            series: series,
            seriestype: seriestype,
          },
          {
            seriesname: {
              [Op.like]: '%${seriesname}%',
            }
          }
    
        ]
      }})
      res.json({"LastNumber":lastno})
    } catch (error) {
        res.json('Invalid data')
    }
  }),
  updateNumberRunning.post("/updateNumberRunningINV", async (req, res) => {
    const lastno = req.body.lastno
    const series = req.body.series
    const seriesname = req.body.seriesname
    const seriesyear = req.body.seriesyear
    const companycode = req.body.companycode
    try {
       const update = await NumberSeriesINV.update({lastno:lastno},{ 
        where: {
        [Op.or]: [
          {
            companycode: companycode,
            series: series,
            seriesyear: seriesyear,
          },
          {
            seriesname: {
              [Op.like]: '%${seriesname}%',
            }
          }
        ]
      }})
      res.json({"LastNumber":lastno})
    } catch (error) {
        res.json('Invalid data')
    }
  })

module.exports = updateNumberRunning;