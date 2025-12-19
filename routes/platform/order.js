const express = require('express')
const {
  // getOrder,
  insert,
  removeOrder,
  getData
} = require('../../controllers/order.controller')

const router = express.Router()

// router.post('/all', getOrder)
router.post('/insert', insert)
router.delete('/delete', removeOrder)

router.get('/getData', getData)
// router.post('/insert', getOrder)
module.exports = router
