const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization || "";

    // Check if it starts with "Bearer "
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // If no token
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "default_jwt_secret_key";
    const decoded = jwt.verify(token, secret);

    // Attach user ID to request object
    req.userId = decoded.id;

    // Move to next middleware / route
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
