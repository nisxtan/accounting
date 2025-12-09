const jwt = require("jsonwebtoken");
const { JwtConfig } = require("../config/config");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      JwtConfig.JWT_SECRET || "fallback-secret"
    );
    // console.log("BACKEND RECEIVED TOKEN:", req.headers.authorization);

    // console.log("Decoded token:", decoded); // Debug log
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
