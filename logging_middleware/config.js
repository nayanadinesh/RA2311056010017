const path = require("path");
const dotenv = require("dotenv");

// Load credentials from the backend .env file
dotenv.config({
  path: path.join(__dirname, "..", "notification_app_be", ".env"),
});

const BASE_URL = "http://20.207.122.201/evaluation-service";

module.exports = {
  BASE_URL,
  EMAIL: process.env.EMAIL,
  NAME: process.env.NAME,
  ROLL_NO: process.env.ROLL_NO,
  ACCESS_CODE: process.env.ACCESS_CODE,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
};
