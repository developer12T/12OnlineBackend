// controllers/auth.controller.js
const { getToken } = require('../services/oauth.service')

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body

    const tokenData = await getToken(username, password)

    return res.json({
      status: 200,
      token: tokenData.access_token,
      expires_in: tokenData.expires_in
    })
  } catch (err) {
    console.error(err.message)
    res.status(400).json({ message: 'Login failed' })
  }
}
