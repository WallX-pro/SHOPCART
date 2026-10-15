// index.js — ShopKart backend entry point
//
// Middleware ordering matters:
//  1. helmet() — sets security headers before anything else runs.
//  2. cors()   — must come before routes so preflight OPTIONS requests are handled.
//  3. express.json() — parses request bodies.
//  4. cookie-parser — parses the token cookie before auth middleware needs it.
//  5. Routes.
//  6. errorHandler — must be last; Express identifies 4-arg functions as error handlers.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/error.middleware");
const customerRoutes = require("./routes/customer.routes");
const productRoutes   = require("./routes/product.routes");
const wishlistRoutes  = require("./routes/wishlist.routes");
const cartRoutes      = require("./routes/cart.routes");
const orderRoutes     = require("./routes/order.routes");

const app = express();

// ── Security headers ───────────────────────────────────────────────────────────
// helmet() sets X-Content-Type-Options, X-Frame-Options, CSP etc. by default.
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
// credentials:true allows the browser to send the HttpOnly cookie cross-origin.
// Only the configured CLIENT_URL is allowed — no wildcards with credentials.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body / cookie parsing ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
// No /api prefix per spec. Routes are mounted at their resource names directly.
app.use("/customers", customerRoutes);
app.use("/products",  productRoutes);
app.use("/wishlist",  wishlistRoutes);
app.use("/cart",      cartRoutes);
app.use("/orders",    orderRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "ShopKart API is running" });
});

// ── 404 for unmatched routes ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Central error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  ShopKart API running on http://localhost:${PORT}`);
  });
});
