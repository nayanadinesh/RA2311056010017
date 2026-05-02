const axios = require("axios");
const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  BASE_URL,
  EMAIL,
  NAME,
  ROLL_NO,
  ACCESS_CODE,
  CLIENT_ID,
  CLIENT_SECRET,
} = require("../logging_middleware/config");
const { Log } = require("../logging_middleware/logger");

const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "..", "notification_app_fe");

const typeWeights = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const contentTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
};

async function getAppToken() {
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

  const token =
    response.data.access_token || response.data.accessToken || response.data.token;

  if (!token) {
    throw new Error("Auth token was not found in the response");
  }

  return token;
}

function getUnixTimestamp(timestamp) {
  // Convert timestamp format into a JavaScript date
  const fixedTimestamp = timestamp.replace(" ", "T");
  return Math.floor(new Date(fixedTimestamp).getTime() / 1000);
}

function getPriorityScore(notification) {
  const typeWeight = typeWeights[notification.Type] || 0;
  const unixTimestamp = getUnixTimestamp(notification.Timestamp);

  return typeWeight * 1000000000 + unixTimestamp;
}

function getTopNotifications(notifications) {
  const notificationsWithScore = notifications.map((notification) => {
    return {
      ...notification,
      priorityScore: getPriorityScore(notification),
    };
  });

  notificationsWithScore.sort((a, b) => b.priorityScore - a.priorityScore);

  return notificationsWithScore.slice(0, 10);
}

function showTopNotifications(topTen) {
  console.log("\nTop 10 Priority Notifications\n");
  topTen.forEach((notification, index) => {
    console.log(`${index + 1}. ${notification.Type}`);
    console.log(`   ID: ${notification.ID}`);
    console.log(`   Message: ${notification.Message}`);
    console.log(`   Timestamp: ${notification.Timestamp}`);
    console.log(`   Priority Score: ${notification.priorityScore}`);
    console.log("");
  });
}

async function fetchPriorityNotifications() {
  const token = await getAppToken();
  await Log("backend", "info", "auth", "Token fetched successfully");

  const response = await axios.get(`${BASE_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    proxy: false,
  });

  await Log("backend", "info", "service", "Notifications fetched successfully");

  const notifications = Array.isArray(response.data)
    ? response.data
    : response.data.notifications;

  if (!Array.isArray(notifications)) {
    throw new Error("Notifications were not found in the response");
  }

  const topTen = getTopNotifications(notifications);
  await Log("backend", "info", "service", "Top 10 notifications prepared");

  return topTen;
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(data));
}

function serveFile(request, response) {
  const safeUrl = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(frontendPath, safeUrl);

  if (!filePath.startsWith(frontendPath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "text/plain",
    });
    response.end(content);
  });
}

async function handleRequest(request, response) {
  if (request.url === "/api/priority-notifications") {
    try {
      const topTen = await fetchPriorityNotifications();
      sendJson(response, 200, {
        notifications: topTen,
        total: topTen.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      await Log("backend", "error", "service", error.message);
      sendJson(response, 500, {
        error: "Could not fetch notifications",
        details: error.response?.data || error.message,
      });
    }
    return;
  }

  serveFile(request, response);
}

async function startApp() {
  try {
    await Log("backend", "info", "service", "Campus notification app started");

    const topTen = await fetchPriorityNotifications();
    showTopNotifications(topTen);
    await Log("backend", "info", "service", "Top 10 notifications displayed");

    const server = http.createServer(handleRequest);
    server.listen(PORT, () => {
      console.log(`Frontend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("Something went wrong");
    console.log(error.response?.data || error.message);
    await Log("backend", "error", "service", error.message);
  }
}

startApp();
