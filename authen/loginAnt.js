const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { UserAnt } = require('./model/userAnt');
// const os = require('os');
const router = express.Router();

router.post('/loginAnt', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const dataUser = await UserAnt.findAll({
          attributes: { exclude: ['id'] },
          where: {
            Col_LoginName: username,
          },
        });
      
        if (dataUser.length === 0) {
          res.status(401).json({ error: "Invalid username or password" });
        } else {
         
          const dbPassword = dataUser[0].Col_PWord;
          const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
          
          if (dbPassword === hashedPassword) {
            const token = jwt.sign(
                { username: dataUser.username },
                process.env.TOKEN_KEY,
                { expiresIn: '2h' })
                res.json({ token, fullname: dataUser[0].Col_Name, department:dataUser[0].Col_o_JobTitle, departmentDescrip:dataUser[0].Col_DeptInfo } );
          } else {
            res.status(401).json({ error: "Invalid username or password" });
          }
        }
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Invalid req' });
      }
});

module.exports = router;
