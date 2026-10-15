// controllers/order.controller.js
//
// Security decisions (defend these in viva):
//
// 1. SERVER-SIDE TOTAL: totalAmount = Σ(latest DB price × qty).
//    Any client-supplied total is completely ignored. This prevents a user
//    from sending { totalAmount: 1 } and getting a ₹1,00,000 order.
//
// 2. LATEST PRICES AT CHECKOUT: We re-fetch every product from MongoDB at
//    checkout time, not from the cart snapshot. If a product's price changed
//    since it was added to cart, the order reflects the current price.
//
// 3. HMAC SIGNATURE VERIFICATION with timingSafeEqual: We sign the Razorpay
//    order_id + "|" + payment_id with HMAC-SHA256 using the Key Secret.
//    timingSafeEqual prevents timing attacks that could leak whether a
//    signature was "almost correct".
//
// 4. DB-STORED razorpayOrderId for HMAC: We use the id stored in the DB,
//    not the one from the request body, so a tampered order_id in the
//    request cannot forge a valid signature.
//
// 5. ATOMIC STOCK DECREMENT: findOneAndUpdate({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})
//    — if the document isn't found (stock went below qty between verification
//    and decrement), we roll back all previous decrements and mark the order
//    FAILED. This prevents overselling under concurrent load.
//
// 6. IDEMPOTENT verify-payment: If called twice (network retry), we detect
//    paymentStatus === "PAID" and return the order as-is without double-
//    decrementing stock or clearing cart again.
//
// 7. OWNERSHIP CHECKS: Every order GET checks order.user === req.user._id.
//    A 404 (not 403) is returned to avoid leaking that the order exists.

const crypto      = require("crypto");
const mongoose    = require("mongoose");
const { body }    = require("express-validator");
const Order       = require("../models/order.model");
const Product     = require("../models/product.model");
const User        = require("../models/user.model");
const razorpay    = require("../config/razorpay");
const asyncHandler = require("../utils/asyncHandler");

// ── Shipping address validators ────────────────────────────────────────────────
const shippingValidators = [
  body("shippingAddress.fullName").trim().notEmpty().withMessage("Full name is required"),
  body("shippingAddress.phone")
    .matches(/^\d{10}$/)
    .withMessage("Phone must be exactly 10 digits"),
  body("shippingAddress.addressLine1").trim().notEmpty().withMessage("Address is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.state").trim().notEmpty().withMessage("State is required"),
  body("shippingAddress.pincode")
    .matches(/^\d{6}$/)
    .withMessage("Pincode must contain 6 digits"),
];

// ── POST /orders/create-payment-order ─────────────────────────────────────────
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;

  // Load the user's cart
  const user = await User.findById(req.user._id).populate({
    path: "cart.product",
    select: "name price image stock",
  });

  if (!user.cart.length) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  // Re-fetch every product for latest price and stock validation
  const productIds = user.cart.map((item) => item.product._id);
  const products   = await Product.find({ _id: { $in: productIds } });
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  // Validate each cart item against latest product data
  const snapshots = [];
  for (const item of user.cart) {
    const latest = productMap[item.product._id.toString()];
    if (!latest) {
      return res.status(404).json({
        success: false,
        message: `Product "${item.product.name}" is no longer available`,
      });
    }
    if (latest.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${latest.name}" (available: ${latest.stock})`,
      });
    }
    // Build snapshot — price locked to what it is RIGHT NOW, not cart cache
    snapshots.push({
      product:  latest._id,
      name:     latest.name,
      price:    latest.price,   // server-computed, ignoring any client total
      quantity: item.quantity,
      image:    latest.image,
    });
  }

  // Compute total server-side — client total is never used
  const totalAmount = snapshots.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // If a PENDING_PAYMENT order already exists for this user, cancel it
  // (user pressed "Place Order" twice — only the latest should count)
  await Order.deleteMany({
    user: req.user._id,
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
  });

  // Create ShopKart order in DB first (so we have an _id for the Razorpay receipt)
  const order = await Order.create({
    user:            req.user._id,
    items:           snapshots,
    shippingAddress,
    totalAmount,
    paymentStatus:   "PENDING",
    status:          "PENDING_PAYMENT",
  });

  // Create Razorpay order — amount in paise (₹ × 100), rounded to avoid float issues
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(totalAmount * 100),
      currency: "INR",
      receipt:  order._id.toString(),
    });
  } catch (rzpErr) {
    // Clean up the pending order so the user can try again
    await Order.findByIdAndDelete(order._id);
    return res.status(503).json({
      success: false,
      message: "Payment gateway unavailable. Please configure valid Razorpay keys in .env",
      detail:  rzpErr.error?.description || rzpErr.message,
    });
  }

  // Save Razorpay order id so verify-payment can look it up from DB
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(200).json({
    success:         true,
    shopKartOrderId: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount:          razorpayOrder.amount,
    currency:        razorpayOrder.currency,
    key:             process.env.RAZORPAY_KEY_ID, // only Key ID — secret never sent
  });
});

// ── POST /orders/verify-payment ────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    shopKartOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!mongoose.isValidObjectId(shopKartOrderId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  // Load order — must belong to the authenticated user (IDOR protection)
  const order = await Order.findById(shopKartOrderId);
  if (!order || order.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  // Idempotency: if already verified, return as-is without double-decrement
  if (order.paymentStatus === "PAID") {
    return res.status(200).json({ success: true, order });
  }

  // Build HMAC using DB-stored razorpayOrderId (not the request body value)
  // so a tampered order_id in the request cannot produce a valid signature.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
    .digest("hex");

  // timingSafeEqual prevents timing attacks from leaking whether a signature
  // was "close" to valid by measuring response time differences
  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(razorpay_signature,  "hex")
  );

  if (!signaturesMatch) {
    // Order stays PENDING — cart NOT cleared — user can retry
    return res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }

  // ── Atomic stock decrement ───────────────────────────────────────────────────
  // findOneAndUpdate with stock:$gte:qty ensures we only decrement if enough
  // stock still exists. Race condition safe — Mongo executes atomically.
  const decremented = []; // track what we've decremented for rollback

  for (const item of order.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updated) {
      // Stock ran out between verification and decrement — roll back
      for (const prev of decremented) {
        await Product.findByIdAndUpdate(prev.id, {
          $inc: { stock: prev.qty },
        });
      }
      order.paymentStatus = "FAILED";
      order.status        = "PENDING_PAYMENT";
      await order.save();
      return res.status(409).json({
        success: false,
        message: `Item went out of stock: "${item.name}". Payment will be refunded.`,
      });
    }
    decremented.push({ id: item.product, qty: item.quantity });
  }

  // Mark order as PAID and PLACED
  order.paymentStatus      = "PAID";
  order.status             = "PLACED";
  order.razorpayPaymentId  = razorpay_payment_id;
  await order.save();

  // Clear cart — only after confirmed payment
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

  res.status(200).json({ success: true, order });
});

// ── POST /orders/payment-failed ────────────────────────────────────────────────
// Called by the frontend on Razorpay's payment.failed event.
// Only marks FAILED if not already PAID (idempotent). Cart NOT cleared.
const paymentFailed = asyncHandler(async (req, res) => {
  const { shopKartOrderId } = req.body;

  if (!mongoose.isValidObjectId(shopKartOrderId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const order = await Order.findById(shopKartOrderId);
  if (!order || order.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentStatus !== "PAID") {
    order.paymentStatus = "FAILED";
    await order.save();
  }

  res.status(200).json({ success: true, message: "Payment marked as failed", order });
});

// ── POST /orders/webhook (bonus) ───────────────────────────────────────────────
// Razorpay webhook — verifies the x-razorpay-signature header against the
// raw request body using RAZORPAY_WEBHOOK_SECRET (different from Key Secret).
// Uses express.raw() so the body is the original bytes for accurate HMAC.
const webhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];
  const webhookSecret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || !webhookSignature) {
    return res.status(400).json({ success: false, message: "Missing webhook secret or signature" });
  }

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body) // req.body is raw Buffer when express.raw() is used
    .digest("hex");

  const valid = crypto.timingSafeEqual(
    Buffer.from(expectedSig,       "hex"),
    Buffer.from(webhookSignature,  "hex")
  );

  if (!valid) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  const event = JSON.parse(req.body.toString());

  if (event.event === "payment.captured") {
    const razorpayOrderId  = event.payload.payment.entity.order_id;
    const razorpayPaymentId = event.payload.payment.entity.id;

    const order = await Order.findOne({ razorpayOrderId });
    if (!order || order.paymentStatus === "PAID") {
      // Idempotent — already processed
      return res.status(200).json({ success: true });
    }

    // Atomic stock decrement (same logic as verify-payment)
    const decremented = [];
    for (const item of order.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        for (const prev of decremented) {
          await Product.findByIdAndUpdate(prev.id, { $inc: { stock: prev.qty } });
        }
        order.paymentStatus = "FAILED";
        await order.save();
        return res.status(200).json({ success: true }); // always 200 to Razorpay
      }
      decremented.push({ id: item.product, qty: item.quantity });
    }

    order.paymentStatus     = "PAID";
    order.status            = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();
    await User.findByIdAndUpdate(order.user, { $set: { cart: [] } });
  }

  res.status(200).json({ success: true });
});

// ── GET /orders ────────────────────────────────────────────────────────────────
// Returns all non-PENDING_PAYMENT orders for the current user, newest first.
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user:   req.user._id,
    status: { $ne: "PENDING_PAYMENT" }, // hide incomplete payment attempts
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, orders });
});

// ── GET /orders/:id ────────────────────────────────────────────────────────────
// Returns 404 (not 403) when order doesn't belong to req.user to avoid
// leaking that an order with that ID exists at all.
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const order = await Order.findById(id);

  // Return 404 whether order doesn't exist OR belongs to another user
  if (!order || order.user.toString() !== req.user._id.toString()) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.status(200).json({ success: true, order });
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  webhook,
  getOrders,
  getOrderById,
  shippingValidators,
};
