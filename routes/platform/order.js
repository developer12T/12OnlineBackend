const express = require('express')
const {
  getOrder,
  // insert,
  removeOrder,
  getDashboardData,
  updateStatusM3Success,
  updateStatusM3Success2,
  addOrderMakroPro,
  exportOrderExcel,
  updateInvoiceAndCo,
  printDeliveyMackro,
  streamMakroPdf
} = require('../../controllers/order.controller')

const router = express.Router()

router.post('/all', getOrder)
router.post('/printDeliveyMackro', printDeliveyMackro)
router.delete('/delete', removeOrder)
router.post('/getDashboardData', getDashboardData)
router.post('/m3/update-status-success', updateStatusM3Success)
router.get('/m3/update-status-success2', updateStatusM3Success2)
router.get('/addOrderMakroPro', addOrderMakroPro)
router.get('/export/excel', exportOrderExcel)
router.get('/updateInvoiceAndCo', updateInvoiceAndCo)

// ✅ ต้องมีบรรทัดนี้
router.get('/makro/pdf/:token', streamMakroPdf)
module.exports = router
