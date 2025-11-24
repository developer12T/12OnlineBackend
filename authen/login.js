const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./model/users');
const axios = require('axios');
// const os = require('os');
const router = express.Router();

router.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const { Sequelize } = require('sequelize')

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
        { expiresIn: '2h' }
      );
      const timeStamp = await User.update({ loginAt: Sequelize.literal('CURRENT_TIMESTAMP') }, { where: { usercode: dataUser.usercode } })

      return res.json({ token, user: dataUser.username, fullname: dataUser.fullname, company: dataUser.company, department: dataUser.department });
    } else {
      return res.status(401).json({ error: 'wrong-password' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Invalid req' });
  }
});

router.post('/authen', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  try {
    // ยิงไปที่ external API
    const response = await axios.post(
      'https://apps.onetwotrading.co.th/12lmsapi/api/auth/login',
      { username, password },
      { timeout: 20000  } // กัน timeout ค้าง
    );
    const data = response.data;

    if (!data || data.message !== 'Login successful' || !data.user) {
      return res.status(401).json({ error: 'External authentication failed' });
    }

    const extUser = data.user;

    const ourToken = jwt.sign(
      {
        username: extUser.username || username,
        employeeID: extUser.employeeID,
        email: extUser.email,
        fullName: extUser.fullName
      },
      process.env.TOKEN_KEY,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      token: ourToken,        // token ของระบบเรา (2 ชั่วโมง)
      // externalToken: data.token || null, // token ที่ external ส่งกลับ (ถ้ามี)
      user: {
        employeeID: extUser.employeeID || null,
        username: extUser.username || null,
        firstName: extUser.firstName || null,
        lastName: extUser.lastName || null,
        fullName: extUser.fullName || `${extUser.firstName || ''} ${extUser.lastName || ''}`.trim(),
        fullNameThai: extUser.fullNameThai || null,
        email: extUser.email || null,
        position: extUser.position || null,
        department: extUser.department || null,
        company: extUser.company || null,
        status: extUser.status ?? null,
        imgUrl: extUser.imgUrl || null
      }
    });


  } catch (error) {
    console.error('External auth error:', error?.response?.data || error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Unable to connect to auth server' });
  }
});

module.exports = router;
