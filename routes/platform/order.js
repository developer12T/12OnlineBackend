const express = require('express')
const {
  getOrder,
  insert,
  removeOrder,
  getDashboardData
} = require('../../controllers/order.controller')

const router = express.Router()

router.post('/all', getOrder)
router.post('/insert', insert)
router.delete('/delete', removeOrder)

router.post('/getDashboardData', getDashboardData)
// router.post('/insert', getOrder)
module.exports = router
