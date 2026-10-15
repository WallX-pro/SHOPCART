// routes/customer.routes.js
// Applies rate limiting on register + login to slow credential-stuffing attacks.
// Rate limit window: 15 min / 10 attempts. A 429 with Retry-After is returned.

const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  getMe,
  logout,
  changePassword,
  registerValidators,
  loginValidators,
  changePasswordValidators,
} = require("../controllers/customer.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

// Rate limiter: 10 requests per 15 minutes per IP for auth endpoints.
// This limits brute-force without blocking normal users who rarely log in
// more than 10 times in 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,  // Return Retry-After in RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again after 15 minutes",
  },
});

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register", authLimiter, registerValidators, validate, register);
router.post("/login", authLimiter, loginValidators, validate, login);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.patch(
  "/change-password",
  protect,
  changePasswordValidators,
  validate,
  changePassword
);

module.exports = router;
