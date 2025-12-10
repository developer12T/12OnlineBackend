const axios = require("axios");

let cachedToken = null;
let tokenExpireAt = 0;

async function fetchNewToken() {
  const data = new URLSearchParams({
    grant_type: "password",
    username: process.env.BENTO_USERNAME,
    password: process.env.BENTO_PASSWORD,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  });

  const res = await axios.post(process.env.BENTO_TOKEN_URL, data.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  const accessToken = res.data.access_token;
  const expiresIn = res.data.expires_in;

  cachedToken = accessToken;
  tokenExpireAt = Date.now() + expiresIn * 1000;

  console.log("🔑 OAuth → New access token fetched");

  return cachedToken;
}

exports.getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpireAt - 5000) {
    return cachedToken;
  }

  return await fetchNewToken();
};
