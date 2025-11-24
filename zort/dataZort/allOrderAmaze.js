const axios = require('axios');

const orderAmazeAll = async (req, res) => {
    try {
        // 1. Login เพื่อเอา access_token
        const loginResponse = await axios.post(process.env.urlAmaze + '/open-console/api/v1/client/login', {
            input: process.env.amazeUsername || "0991197810",
            password: process.env.amazePassword || "Default123@"
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!loginResponse.data.succeeded || !loginResponse.data.data.access_token) {
            throw new Error('Login failed: ' + JSON.stringify(loginResponse.data));
        }

        const accessToken = loginResponse.data.data.access_token;
        console.log('Login successful, token obtained');

        // 2. ใช้ access_token เรียก order API
        const orderResponse = await axios.get(process.env.urlAmaze + '/open-console/api/v2/client/order?status=ready_to_ship', {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
        });

        return orderResponse.data;
    } catch (error) {
        console.error('Error in orderAmazeAll:', error.response?.data || error.message);
        res.json({ error: 'Internal server error' });
    }
};

module.exports = orderAmazeAll;