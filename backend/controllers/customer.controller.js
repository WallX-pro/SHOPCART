// controllers/customer.controller.js
// Handles all customer-facing auth operations.
//
// Security decisions worth defending:
//  - bcrypt cost 12: ~250ms on a modern CPU — slow enough to resist brute force,
//    fast enough not to throttle legitimate logins.
//  - Login always returns the same 401 "Invalid credentials" for both
//    wrong-email and wrong-password cases, preventing user-enumeration attacks.
//  - Password is never returned; `select:false` enforces this at the model level,
//    but we also .select("-password") where we fetch users without the flag.
//  - JWT is issued into an HttpOnly cookie — JS cannot read it, blocking XSS theft.
//  - The cookie is cleared with the exact same options it was set with to ensure
//    the browser actually removes it (different options = different cookie).

const bcrypt = require("bcrypt");
const { body } = require("express-validator");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// ── Validation rule arrays (reused in the router) ─────────────────────────────

const registerValidators = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .matches(/^\d{10}$/)
    .withMessage("Phone must be exactly 10 digits"),
];

const loginValidators = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidators = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// ── Controller functions ───────────────────────────────────────────────────────

/**
 * POST /customers/register
 * Creates a new customer account.
 * 201: success   400: validation   409: duplicate email
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  // Hash with cost 12 — higher than the minimum 10 for better brute-force resistance.
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName,
    email,
    phone,
    password: hashedPassword,
  });

  // Never expose the hash — return only safe fields.
  res.status(201).json({
    success: true,
    message: "Customer registered successfully",
    customer: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  });
});

/**
 * POST /customers/login
 * Verifies credentials and issues a JWT cookie.
 * 200: success   401: invalid credentials (generic — no field hinting)
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select the password hash for comparison (normally excluded).
  const user = await User.findOne({ email }).select("+password");

  // Use a constant-time comparison for the password to prevent timing attacks.
  // If the user doesn't exist we still run bcrypt.compare (with a dummy hash)
  // so response time is the same regardless of whether the email was found.
  const DUMMY_HASH =
    "$2b$12$invalidhashvalueusedtopreventtimingattacksXXXXXXXXXXXXXX";
  const isMatch = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  generateToken(res, user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",
    customer: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  });
});

/**
 * GET /customers/me
 * Returns the authenticated customer's profile (no password).
 * 200: success   401: not authenticated (handled by middleware)
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by the protect middleware; password already excluded.
  res.status(200).json({
    success: true,
    customer: req.user,
  });
});

/**
 * POST /customers/logout
 * Clears the auth cookie. The cookie options MUST match what was set in
 * generateToken so the browser treats it as the same cookie.
 * 200: always (logout is idempotent from the user's perspective)
 */
const logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0), // immediately expire
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
});

/**
 * PATCH /customers/change-password  (bonus)
 * Verifies the old password then stores a new bcrypt hash.
 * 200: success   400: wrong old password or validation failure
 */
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Re-fetch user with password for comparison
  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Old password is incorrect" });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Password changed successfully" });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  changePassword,
  registerValidators,
  loginValidators,
  changePasswordValidators,
};
