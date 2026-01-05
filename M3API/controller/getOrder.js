const express = require('express');
const getOrder = express.Router();
const { NumberSeries, NumberSeriesINV, COHead } = require('../model/order');
const { Op, sequelize } = require('sequelize');

async function getNumberSeries({
  series,
  seriesname,
  seriestype,
  companycode
}) {
  try {

    // ===== กรณีไม่ส่งเงื่อนไขครบ → ดึงทั้งหมด =====
    if (!series || !seriesname || !seriestype || !companycode) {
      const data = await NumberSeries.findAll({
        attributes: {
          exclude: ['id'],
        },
      })
      return data
    }

    // ===== กรณีมีเงื่อนไข =====
    const data = await NumberSeries.findAll({
      attributes: {
        exclude: ['id'],
      },
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
            },
          },
        ],
      },
    })

    return data

  } catch (error) {
    console.error(error)
    throw error
  }
}

async function getNumberSeriesINV({
  series,
  seriesname,
  seriesyear,
  companycode
}) {
  try {
    if (!series || !seriesname || !seriesyear || !companycode) {
      const data = await NumberSeriesINV.findAll({
        attributes: {
          exclude: ['id'],
        },
      })
      return data
    } else {
      const data = await NumberSeriesINV.findAll({
        attributes: {
          exclude: ['id'],
        },
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
              },
            },
          ],
        },
      })

      const trimmedData = data.map(item => ({
        ...item.get({ plain: true }),
        prefixno: item.prefixno.trim()
      }))

      return trimmedData
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function getInvNumber({ ordertype }) {
  try {
    if (!ordertype) {
      const data = await COHead.findAll({
        attributes: { exclude: ['id'] },
        attributes: ['ordertype', 'customerordno'],
        group: ['OAORTP', 'OACUOR']
      })
      return data

    } else {
      const data = await COHead.findAll({
        attributes: { exclude: ['id'] },
        attributes: ['ordertype', 'customerordno'],
        where: {
          ordertype: ordertype,
        },
        limit: 1,
        order: [
          ['customerordno', 'DESC']
        ]
      })

      return data
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

module.exports = {
  getInvNumber,getNumberSeriesINV,getNumberSeries
}
