const cron = require('node-cron')
const zortCronFunc = require('./zortCorn')

let count = 0

console.log('🕒 CRON BOOTED:', new Date().toISOString())

cron.schedule(
  '*/5 * * * *',
  async () => {
    const startTime = new Date()
    count++

    console.log(`[CRON] tick #${count} at ${startTime.toISOString()}`)

    try {
      await zortCronFunc()
      console.log('[CRON] zortCronFunc done')
    } catch (err) {
      console.error('[CRON] zortCronFunc error:', err)
    }

    const endTime = new Date()
    console.log('[CRON] elapsed sec:', (endTime - startTime) / 1000)
  },
  { timezone: 'Asia/Bangkok' }
)

module.exports = {} // กันเผลอ
