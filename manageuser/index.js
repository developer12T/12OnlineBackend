const express = require('express');
const router = express.Router();

const UserManage = require('./route/user');

// const ProductManage = require('./route/product');
// const ZortRestApi = require('./route/zortRestApi');
// const syncdatabase = require('./controller/syncdatabase');

router.use('/user', UserManage);

module.exports = router