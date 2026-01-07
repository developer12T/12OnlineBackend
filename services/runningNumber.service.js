const counterModel = require('../model/counter')
const { getModelsByChannel } = require('../authen/middleware/channel')
const channel = 'uat'

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
      new: true, // เอาค่าหลัง increment
      upsert: true // ถ้าไม่เจอให้สร้างใหม่
    }
  ).lean()

  return generateRunningNumber({
    year,
    code,
    running: counter.running
  })
}

module.exports = {
  getNextRunning,
  getThaiYear,
  generateRunningNumber
}
