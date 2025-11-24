const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { UserAnt } = require('./model/userAnt');
// const os = require('os');
const router = express.Router();

router.post('/checkToken', async (req, res) => {
    try {
       res.status(200).json('success')
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Invalid req' });
      }
});

module.exports = router;
