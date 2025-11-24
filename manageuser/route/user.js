const express = require('express');
const UserManage = express.Router();

const addUser = require('../controller/addUser')
const editPasswordUser = require('../controller/editPassword')

UserManage.use('/action',addUser);
UserManage.use('/action',editPasswordUser);

module.exports = UserManage;