// routes/order.routes.js
// The webhook route uses express.raw() ONLY for that route so the body
// is an unmodified Buffer — required for accurate HMAC-SHA256 computation.
// All other routes use the global express.json() body parser.

const express = require("express");
const {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  webhook,
  getOrders,
  getOrderById,
  shippingValidators,
} = require("../controllers/order.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate    = require("../middlewares/validate.middleware");

const router = express.Router();

// ── Webhook — no auth, raw body ───────────────────────────────────────────────
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

// ── All other order routes require auth ───────────────────────────────────────
router.use(protect);

router.post("/create-payment-order", shippingValidators, validate, createPaymentOrder);
router.post("/verify-payment",  verifyPayment);
router.post("/payment-failed",  paymentFailed);
router.get("/",                 getOrders);
router.get("/:id",              getOrderById);

module.exports = router;
