const express = require('express')
const router = express.Router()
const printController = require('../controllers/print.controller')
// const auth = require("../middlewares/auth.middleware"); // ถ้ามี

router.post(
  '/original',
  // auth, // ถ้าต้อง auth
  printController.printReceiptOriginal
)

router.post(
  '/originalandcopy',
  // auth, // ถ้าต้อง auth
  printController.printReceiptOriginalAndCopy
)

router.post(
  '/copy',
  // auth, // ถ้าต้อง auth
  printController.printReceiptCopy
)


module.exports = router
