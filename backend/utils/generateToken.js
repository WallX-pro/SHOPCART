// utils/generateToken.js
// Creates a signed JWT and writes it to an HttpOnly cookie on the response.
// HttpOnly prevents JavaScript access → XSS cannot read the token.
// Cookie settings differ by environment because `sameSite:"none"` requires
// `secure:true` (HTTPS), which doesn't exist on localhost.

const jwt = require("jsonwebtoken");

/**
 * @param {object} res        - Express response object
 * @param {string} userId     - MongoDB _id to embed as JWT subject
 * @returns {string}          - The signed token (useful for tests)
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  // Parse JWT_EXPIRES_IN (e.g. "7d") → milliseconds for cookie maxAge.
  const msMap = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const raw = process.env.JWT_EXPIRES_IN || "7d";
  const match = raw.match(/^(\d+)([smhd])$/);
  const maxAge = match ? parseInt(match[1]) * msMap[match[2]] : 7 * 86_400_000;

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,            // not readable by browser JS → blocks XSS token theft
    secure: isProduction,      // HTTPS-only in prod; plain HTTP allowed in dev
    sameSite: isProduction ? "none" : "lax", // cross-origin in prod (Vercel→Railway etc.)
    maxAge,
  });

  return token;
};

module.exports = generateToken;
