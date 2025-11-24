const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./model/users');
// const os = require('os');
const router = express.Router();

router.post('/devlogin', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const {Sequelize} = require('sequelize')

  async function checkPassword(inputPassword, hashedPassword) {
    try {
      return await bcrypt.compare(inputPassword, hashedPassword);
    } catch (error) {
      throw new Error('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    }
  }

  try {
    const dataUser = await User.findOne({
      where: {
        username: username,
      },
    });

    if (!dataUser) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const hashedPasswordFromDB = dataUser.password;
    const isPasswordCorrect = await checkPassword(password, hashedPasswordFromDB);
    if (isPasswordCorrect) {
      const token = jwt.sign(
        { username: dataUser.username },
        process.env.TOKEN_KEY,
        { expiresIn: '16h' }
      );
      const timeStamp = await User.update({loginAt:Sequelize.literal('CURRENT_TIMESTAMP')},{where:{usercode:dataUser.usercode}})

      return res.json({ token, fullname: dataUser.fullname, company:dataUser.company , department:dataUser.department });
    } else {
      return res.status(401).json({ error: 'wrong-password' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Invalid req' });
  }
});

module.exports = router;
