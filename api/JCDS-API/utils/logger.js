const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "..", "logs", "app.log");
if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile));
}

function timestamp() {
  return new Date().toISOString();
}

function writeLog(level, message) {
  const logMessage = `[${timestamp()}] [${level.toUpperCase()}] ${message}\n`;
  if (level === "error") {
    console.error(logMessage);
  } else if (level === "warn") {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error("Failed to write log to file:", err);
  });
}

module.exports = {
  info: (msg) => writeLog("info", msg),
  warn: (msg) => writeLog("warn", msg),
  error: (msg) => writeLog("error", msg),
};
