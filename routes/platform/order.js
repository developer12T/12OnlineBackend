const express = require('express')
const {
  getOrder,
  insert,
  removeOrder,
  getDashboardData,
  updateStatusM3Success
} = require('../../controllers/order.controller')

const router = express.Router()

router.post('/all', getOrder)
router.post('/insert', insert)
router.delete('/delete', removeOrder)
router.post('/m3/update-status-success', updateStatusM3Success)

router.post('/getDashboardData', getDashboardData)
// router.post('/insert', getOrder)
module.exports = router
