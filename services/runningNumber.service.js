const counterModel = require('../model/counter')
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
  if (!fix) throw new Error('fix is required')

  const year = getThaiYear() // 🔥 ปีปัจจุบัน
  const prefix = `${year}${fix}`

  const lastRow = await OOHEAD.findOne({
    where: {
      OAORTP: '071'
    },
    order: [['OACUOR', 'DESC']],
    attributes: ['OACUOR'],
    raw: true
  })

  let nextRunning = 1

  if (lastRow?.OACUOR) {
    const lastRunning = lastRow.OACUOR.slice(prefix.length) // 6 ตัวท้าย
    nextRunning = parseInt(lastRunning, 10) + 1
  }

  const runningStr = String(nextRunning).padStart(6, '0')
  return `${prefix}${runningStr}`
}

module.exports = {
  getNextRunning,
  getNextRunningFromOOHEAD,
  getThaiYear,
  generateRunningNumber
}
