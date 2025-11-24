const express = require('express');
const editPasswordUser = express.Router();
const bcrypt = require('bcrypt');

const { Sequelize } = require('sequelize');
const { User } = require('../model/user')
editPasswordUser.post('/resetPassword', async(req,res)=>{

    const saltRounds = 10; 

    async function hashPassword(password) {
      try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
      } catch (error) {
        throw new Error('เกิดข้อผิดพลาดในการแฮชรหัสผ่าน');
      }
    }

    try {
        const newPassword = '123456'; 
        const hashedPassword = await hashPassword(newPassword);
    
    
        const updatedUser = await User.update(
          { password: hashedPassword },
          { where: { username: req.body.username } }
        );
    
        if (updatedUser) {
          res.json({ message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว' });
        } else {
          res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ต้องการรีเซ็ตรหัสผ่าน' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระหว่างการรีเซ็ตรหัสผ่าน' });
      }
})

editPasswordUser.post('/changePassword', async(req,res)=>{
    const saltRounds = 10; 

    async function hashPassword(password) {
      try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
      } catch (error) {
        throw new Error('เกิดข้อผิดพลาดในการแฮชรหัสผ่าน');
      }
    }

    try {
        const newPassword = req.body.newPassword; 
        const hashedPassword = await hashPassword(newPassword);
    
    
        const updatedUser = await User.update(
          { password: hashedPassword },
          { where: { username: req.body.userName } }
        );
    
        if (updatedUser) {
          res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อย' });
        } else {
          res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ต้องการรีเซ็ตรหัสผ่าน' });
        }
      } catch (error) {
        console.error(error);
        res.status(500)
      }
})

module.exports = editPasswordUser;    