// models/order.model.js
//
// Design notes:
//  - items[] stores SNAPSHOTS of name/price/image at purchase time.
//    If a product's price changes later, order history still shows what the
//    customer actually paid — critical for receipts and refund calculations.
//  - totalAmount is set SERVER-SIDE from latest product prices, never from
//    any client-supplied value.
//  - razorpayOrderId is indexed for fast webhook lookup.
//  - Ownership is enforced in the controller: every GET/POST checks
//    order.user.toString() === req.user._id.toString().
//  - PENDING_PAYMENT orders are hidden from GET /orders list (only PLACED+
//    are shown), but are accessible via GET /orders/:id for verify-payment.

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name:     { type: String,  required: true },   // snapshot
    price:    { type: Number,  required: true },   // snapshot — what they paid
    quantity: { type: Number,  required: true },
    image:    { type: String,  required: true },   // snapshot
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName:    { type: String, required: true },
    phone:       { type: String, required: true },
    addressLine1:{ type: String, required: true },
    city:        { type: String, required: true },
    state:       { type: String, required: true },
    pincode:     { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items:           [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"],
      default: "PENDING_PAYMENT",
    },
    razorpayOrderId:  { type: String, index: true },
    razorpayPaymentId:{ type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
