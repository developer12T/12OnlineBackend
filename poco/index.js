const express = require('express');
const router = express.Router();

const FileManage = require('./route/File');
const ItemManage = require('./route/Item');


router.use('/file', FileManage);
router.use('/item', ItemManage);


module.exports = router