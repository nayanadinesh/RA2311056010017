const axios = require("axios");
const { BASE_URL } = require("./config");
const { getToken } = require("./auth");

const validStacks = ["backend", "frontend"];
const validLevels = ["debug", "info", "warn", "error", "fatal"];

const backendPackages = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
];

const frontendPackages = ["api", "component", "hook", "page", "state", "style"];
const bothPackages = ["auth", "config", "middleware", "utils"];

function isValidPackage(stack, packageName) {
  if (bothPackages.includes(packageName)) {
    return true;
  }

  if (stack === "backend") {
    return backendPackages.includes(packageName);
  }

  if (stack === "frontend") {
    return frontendPackages.includes(packageName);
  }

  return false;
}

async function Log(stack, level, packageName, message) {
  try {
    // Validate log data before sending to the server
    if (!validStacks.includes(stack)) {
      throw new Error("Invalid stack value");
    }

    if (!validLevels.includes(level)) {
      throw new Error("Invalid level value");
    }

    if (!isValidPackage(stack, packageName)) {
      throw new Error("Invalid package value for this stack");
    }

    const token = await getToken();

    const logBody = {
      stack,
      level,
      package: packageName,
      message,
    };

    const response = await axios.post(`${BASE_URL}/logs`, logBody, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      proxy: false,
    });

    const logID = response.data.logID || response.data.logId || response.data.id;
    console.log("Log sent successfully:", logID || response.data);
  } catch (error) {
    console.log("Log failed:", error.response?.data || error.message);
  }
}

module.exports = { Log };
