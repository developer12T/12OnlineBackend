// myCronJobFunction.js
require('dotenv').config()
const jwt = require('jsonwebtoken')
const axios = require('axios')

/**
 * Validate ENV early (fail fast)
 */
if (!process.env.API_URL) {
  throw new Error('❌ Missing env: API_URL')
}
if (!process.env.TOKEN_KEY) {
  throw new Error('❌ Missing env: TOKEN_KEY')
}

const api = axios.create({
  baseURL: process.env.API_URL.replace(/\/+$/, ''), // ตัด / ท้าย
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Helper: call API safely (ไม่ล้มทั้ง cron)
 */
async function safePut (name, url, payload) {
  const start = Date.now()
  try {
    console.log(`[CRON] ${name} start`)
    const res = await api.get(url, payload)
    console.log(
      `[CRON] ${name} success (${Date.now() - start} ms)`,
      res?.data ?? ''
    )
    return res?.data
  } catch (err) {
    console.error(
      `[CRON] ${name} failed`,
      err.response?.status,
      err.response?.data || err.message
    )
    return null
  }
}

async function zortCronFunc () {
  // สร้าง token ใหม่ทุกครั้ง (ปลอดภัย)
  const token = jwt.sign({ username: 'systemm3' }, process.env.TOKEN_KEY, {
    expiresIn: '2h'
  })

  const payload = { token }

  // ยิงทีละตัว แยก error ชัด
  await safePut(
    'addOrderMakroPro',
    '/online/api/order/addOrderMakroPro',
    payload
  )

  // await safePut(
  //   'addOrderAmaze',
  //   '/zort/order/OrderManage/addOrderAmaze',
  //   payload
  // )
}

module.exports = zortCronFunc
