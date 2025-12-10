const express = require('express')
const {
  getOrder,
  insert,
  removeOrder,

} = require('../../controllers/oder.controller')

const router = express.Router()

router.get('/all', getOrder)
router.post('/insert', insert)
router.delete('/delete', removeOrder)
// router.post('/insert', getOrder)
module.exports = router
