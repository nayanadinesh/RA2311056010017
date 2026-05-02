const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
  BASE_URL,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE,
} = require("../logging_middleware/config");

const envPath = path.join(__dirname, ".env");

function updateEnvValue(envText, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(envText)) {
    return envText.replace(regex, line);
  }

  return `${envText.trim()}\n${line}\n`;
}

function saveClientCredentials(clientID, clientSecret) {
  // Save credentials so index.js can use them later
  let envText = fs.readFileSync(envPath, "utf8");
  envText = updateEnvValue(envText, "CLIENT_ID", clientID);
  envText = updateEnvValue(envText, "CLIENT_SECRET", clientSecret);
  fs.writeFileSync(envPath, envText);
}

async function registerStudent() {
  try {
    const registerBody = {
      email: "nd6583@srmist.edu.in",
      name: "Nayana Dinesh",
      mobileNo: "9072058552",
      githubUsername: "nayandinesh",
      rollNo: "RA2311056010017",
      accessCode: "QkbpxH",
    };

    const response = await axios.post(`${BASE_URL}/register`, registerBody);
    const clientID = response.data.clientID || response.data.clientId;
    const clientSecret = response.data.clientSecret;

    console.log("Registration successful");
    console.log("clientID:", clientID);
    console.log("clientSecret:", clientSecret);

    if (clientID && clientSecret) {
      saveClientCredentials(clientID, clientSecret);
      console.log(".env updated with client credentials");
    }
  } catch (error) {
    console.log("Registration failed");
    console.log(error.response?.data || error.message);
  }
}

registerStudent();
