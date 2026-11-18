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
async function safePut (name, url, payload, method = 'get') {
  const start = Date.now()
  try {
    console.log(`[CRON] ${name} start`)
    // route แบบ PUT (เช่น /zort/...) ต้องส่ง token ใน body
    const res =
      method === 'put' ? await api.put(url, payload) : await api.get(url, payload)
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

  await safePut('addOrderAmaze', '/online/api/order/addOrderAmaze', payload)

  // backup: ตัวเดิมที่บันทึกลงฐาน SQL (zort) — ปิดไว้ ใช้ Mongo แทน
  // await safePut(
  //   'addOrderAmazeSql',
  //   '/zort/order/OrderManage/addOrderAmaze',
  //   payload,
  //   'put'
  // )
}

module.exports = zortCronFunc
