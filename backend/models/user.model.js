// models/user.model.js
// Stores customer data for ShopKart.
//
// Design notes:
//  - `password` has `select: false` so it is NEVER returned in any query
//    unless explicitly requested with `.select("+password")`. This is a
//    defence-in-depth measure — even if a controller accidentally returns the
//    full user document, the hash is absent.
//  - Cart quantities and wishlist item counts are NEVER stored; they are
//    derived at query time to prevent stale data.
//  - Subtotals / totals do NOT live in the DB; they are computed server-side
//    from the latest product prices to prevent price manipulation.

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity cannot be less than 1"],
    },
  },
  { _id: false } // No separate _id for sub-documents — keeps the cart lean
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // ← never returned in queries by default
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{10}$/, "Phone must be exactly 10 digits"],
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
