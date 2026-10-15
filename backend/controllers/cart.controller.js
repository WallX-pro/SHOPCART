// controllers/cart.controller.js
//
// Design notes:
//  - Stock is checked at ADD and PATCH time — prevents overselling.
//  - Adding the same product twice increments quantity (never creates a
//    duplicate row) — enforced by finding the existing cart item first.
//  - Quantities and totals are NEVER stored. They're derived at GET time
//    from populated product prices to prevent stale data.
//  - Entries whose product was deleted are filtered out in GET /cart so the
//    client never sees orphaned cart items.
//  - User identity always comes from req.user — never from body/params.
//  - Every mutation returns the full updated cart so the frontend context
//    can replace its state from a single source of truth.

const mongoose    = require("mongoose");
const { body }    = require("express-validator");
const User        = require("../models/user.model");
const Product     = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");

// ── Helper: populate and return the user's cart ────────────────────────────────
// Filters out any cart entries whose product has been deleted from the catalogue.
const getPopulatedCart = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "cart.product",
    select: "name price category image stock",
  });

  // Filter stale entries (product deleted after being added to cart)
  const cleanCart = user.cart.filter((item) => item.product !== null);

  // If we found stale entries, persist the cleaned cart
  if (cleanCart.length !== user.cart.length) {
    user.cart = cleanCart;
    await user.save();
  }

  return cleanCart;
};

// ── Validators ─────────────────────────────────────────────────────────────────
const updateQtyValidators = [
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a whole number and at least 1"),
];

// ── GET /cart ──────────────────────────────────────────────────────────────────
const getCart = asyncHandler(async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);
  res.status(200).json({ success: true, cart });
});

// ── POST /cart/:productId ──────────────────────────────────────────────────────
// New item → qty 1.  Existing item → qty + 1.
// Returns 400 if product is out of stock or adding one more would exceed stock.
const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (product.stock === 0) {
    return res.status(400).json({ success: false, message: "Product is out of stock" });
  }

  const user = await User.findById(req.user._id);
  const existingItem = user.cart.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    // Increment — but cap at stock
    if (existingItem.quantity >= product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available`,
      });
    }
    existingItem.quantity += 1;
  } else {
    user.cart.push({ product: productId, quantity: 1 });
  }

  await user.save();
  const cart = await getPopulatedCart(req.user._id);
  res.status(200).json({ success: true, cart });
});

// ── PATCH /cart/:productId ─────────────────────────────────────────────────────
// Sets the quantity to the requested value.
// 400 if quantity < 1, not an integer, or > stock. 404 if product not in cart.
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity }  = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (quantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} unit(s) available`,
    });
  }

  const user = await User.findById(req.user._id);
  const cartItem = user.cart.find(
    (item) => item.product.toString() === productId
  );

  if (!cartItem) {
    return res
      .status(404)
      .json({ success: false, message: "Product not in cart" });
  }

  cartItem.quantity = quantity;
  await user.save();

  const cart = await getPopulatedCart(req.user._id);
  res.status(200).json({ success: true, cart });
});

// ── DELETE /cart/:productId ────────────────────────────────────────────────────
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const user = await User.findById(req.user._id);
  const before = user.cart.length;

  // $pull removes atomically by product ObjectId
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { cart: { product: new mongoose.Types.ObjectId(productId) } },
  });

  // Re-fetch to confirm deletion
  const updatedUser = await User.findById(req.user._id);
  if (updatedUser.cart.length === before) {
    return res
      .status(404)
      .json({ success: false, message: "Product not in cart" });
  }

  const cart = await getPopulatedCart(req.user._id);
  res.status(200).json({ success: true, cart });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateQtyValidators,
};
