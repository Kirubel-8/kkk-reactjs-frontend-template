const jwt = require("jsonwebtoken");

let blacklistedTokens = new Set();

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  if (blacklistedTokens.has(token)) {
    return res
      .status(401)
      .json({ message: "Invalid token, please log in again." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

const blacklistToken = (token) => {
  if (token) {
    blacklistedTokens.add(token);
  }
};

module.exports = {
  verifyToken,
  blacklistToken,
};
