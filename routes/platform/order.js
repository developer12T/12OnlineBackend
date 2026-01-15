const express = require('express')
const {
  getOrder,
  // insert,
  removeOrder,
  getDashboardData,
  updateStatusM3Success,
  addOrderMakroPro,
  exportOrderExcel
} = require('../../controllers/order.controller')

const router = express.Router()

router.post('/all', getOrder)
router.delete('/delete', removeOrder)
router.post('/m3/update-status-success', updateStatusM3Success)
router.get('/addOrderMakroPro', addOrderMakroPro)
router.get('/export/excel', exportOrderExcel)
module.exports = router
