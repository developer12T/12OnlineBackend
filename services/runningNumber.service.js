const counterModel = require('../model/counter')
const orderModel = require('../model/order')
const { getModelsByChannel } = require('../authen/middleware/channel')
const channel = 'uat'
const { OOHEAD } = require('../model/master')
const { Op } = require('sequelize')

function getThaiYear (date = new Date()) {
  return date.getFullYear() + 543
}

function generateRunningNumber ({ year, code, running }) {
  const yearStr = String(year)
  const codeStr = String(code).padStart(3, '0')
  const runningStr = String(running).padStart(6, '0')

  return `${yearStr}${codeStr}${runningStr}`
}

/**
 * ดึง running number ถัดไป (atomic)
 * @param {string} code - รหัสกลาง เช่น "171"
 * @returns {Promise<string>} running number เช่น "2564171000001"
 */

async function getNextRunning (code) {
  if (!code) {
    throw new Error('code is required')
  }

  const year = getThaiYear()
  const { Counter } = getModelsByChannel(channel, null, counterModel)

  const counter = await Counter.findOneAndUpdate(
    { year, code },
    {
      $inc: { running: 1 },
      $setOnInsert: { year, code }
    },
    {
      new: true,
      upsert: true
    }
  ).lean()

  return generateRunningNumber({
    year,
    code,
    running: counter.running
  })
}

async function getNextRunningFromOOHEAD (fix) {
  const channel = 'uat'
  const { Order } = getModelsByChannel(channel, null, orderModel)

  const year = getThaiYear()
  const prefix = `${year}${fix}`

  // -----------------------------
  // 1. MSSQL (OOHEAD)
  // -----------------------------
  const lastOOHEAD = await OOHEAD.findOne({
    where: {
      OAORTP: '071',
      OACUOR: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['OACUOR', 'DESC']],
    attributes: ['OACUOR'],
    raw: true
  })

  let lastRunningSql = 0
  if (lastOOHEAD?.OACUOR) {
    lastRunningSql = parseInt(lastOOHEAD.OACUOR.slice(prefix.length), 10)
  }

  // -----------------------------
  // 2. MongoDB (orders.invno)
  // -----------------------------
  const lastMongo = await Order.findOne(
    {
      invno: { $regex: `^${prefix}` }
    },
    { invno: 1 }
  )
    .sort({ invno: -1 })
    .lean()

  let lastRunningMongo = 0
  if (lastMongo?.invno) {
    lastRunningMongo = parseInt(lastMongo.invno.slice(prefix.length), 10)
  }

  // -----------------------------
  // 3. Pick MAX + 1
  // -----------------------------
  const nextRunning = Math.max(lastRunningSql, lastRunningMongo) + 1

  const runningStr = String(nextRunning).padStart(6, '0')
  return `${prefix}${runningStr}`
}

module.exports = {
  getNextRunning,
  getNextRunningFromOOHEAD,
  getThaiYear,
  generateRunningNumber
}
