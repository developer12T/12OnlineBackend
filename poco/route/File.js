const express = require('express');
const FileManage = express.Router();

const addFile = require('../controller/addFile')
const readFile = require('../controller/readFile')


FileManage.use('/FileManage',addFile);
FileManage.use('/FileManage',readFile); 


module.exports = FileManage;