const axios = require("axios");
const {
  BASE_URL,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE,
  CLIENT_ID,
  CLIENT_SECRET,
} = require("./config");

let cachedToken = null;

async function getToken() {
  // If token is already available, use it again
  if (cachedToken) {
    return cachedToken;
  }

  const authBody = {
    email: EMAIL,
    name: NAME,
    rollNo: ROLL_NO,
    accessCode: ACCESS_CODE,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  };

  const response = await axios.post(`${BASE_URL}/auth`, authBody, {
    proxy: false,
  });

  cachedToken =
    response.data.access_token ||
    response.data.accessToken ||
    response.data.token;

  if (!cachedToken) {
    throw new Error("Auth token was not found in the response");
  }

  return cachedToken;
}

module.exports = { getToken };
