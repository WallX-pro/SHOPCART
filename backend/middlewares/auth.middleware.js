// middlewares/auth.middleware.js
// Authenticates requests by verifying the JWT from the HttpOnly cookie.
// Falls back to the Authorization header so Postman (which cannot set
// cookies manually) can still test protected routes.
//
// Security: we load the user from the DB (minus password) so that if
// an account is deleted between requests, subsequent calls still fail.

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Prefer the HttpOnly cookie (browser clients)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback: Authorization: Bearer <token> (Postman / mobile clients)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  // Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Expired, malformed, or tampered tokens all get the same generic message
    // so we don't leak whether a token was once valid.
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  // Load fresh user data — exclude password even though select:false is the default
  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  req.user = user;
  next();
});

module.exports = { protect };
