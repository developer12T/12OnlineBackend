const axios = require('axios'); 

const productDataAll = async (req,res) => {
  try {
    const response = await axios.get(process.env.zortapiopenurlProducts, {
        headers: {
          storename: process.env.zortstorename,
          apikey: process.env.zortapikey,
          apisecret: process.env.zortapisecret,
        },
      });
      
    return response.data;
  } catch (error) {
    console.error(error);
    res.json({ error: 'Internal server error' });
  }
};

module.exports = productDataAll;