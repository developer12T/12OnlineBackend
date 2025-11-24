const express = require('express');
const addUser = express.Router();
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const { User } = require('../model/user')
addUser.post('/addUser', async(req,res)=>{

  const saltRounds = 10; 

    async function hashPassword(password) {
      try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
      } catch (error) {
        throw new Error('เกิดข้อผิดพลาดในการแฮชรหัสผ่าน');
        // console.log(error)
      }
    }

    const newPassword = req.body.password; 
    const hashedPassword = await hashPassword(newPassword);


    try {
        const addState = await User.create(req.body, {
          where: {
            id: {
              [Sequelize.Op.ne]: req.body.id 
            }
          }
        });

        const updatedUser = await User.update(
          { password: hashedPassword },
          { where: { username: req.body.username } }
        );
    
        res.json(addState)
    
      } catch (error) {
          console.log(error)
          res.json('Invalid req')
      }

})


module.exports = addUser;    