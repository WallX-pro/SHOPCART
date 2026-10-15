// controllers/wishlist.controller.js
//
// Design notes:
//  - $addToSet is atomic — Mongo guarantees no duplicate even under concurrent
//    requests. We still return 409 if the product is already there so the UI
//    can handle it gracefully (show "already in wishlist").
//  - $pull removes the product ref atomically, no separate read-modify-write.
//  - User identity comes ONLY from req.user (JWT); userId is never accepted
//    from the request body or URL params — prevents IDOR attacks.
//  - populate() fields are explicitly listed (name, price, category, image,
//    stock) — password and other sensitive User fields are never leaked.

const mongoose   = require("mongoose");
const User       = require("../models/user.model");
const Product    = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");

// Helper: populate the wishlist and return it
const populateWishlist = (userId) =>
  User.findById(userId).populate({
    path: "wishlist",
    select: "name price category image stock",
  });

// ── GET /wishlist ──────────────────────────────────────────────────────────────
const getWishlist = asyncHandler(async (req, res) => {
  const user = await populateWishlist(req.user._id);
  res.status(200).json({ success: true, wishlist: user.wishlist });
});

// ── POST /wishlist/:productId ──────────────────────────────────────────────────
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  // Confirm product exists before adding
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // Check if already in wishlist — return 409 so frontend treats it as "already added"
  const alreadyIn = await User.exists({
    _id: req.user._id,
    wishlist: productId,
  });
  if (alreadyIn) {
    // Still return the populated wishlist so the client can sync state
    const user = await populateWishlist(req.user._id);
    return res.status(409).json({
      success: false,
      message: "Product already in wishlist",
      wishlist: user.wishlist,
    });
  }

  // $addToSet is atomic — safe even if two requests arrive simultaneously
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { wishlist: productId },
  });

  const user = await populateWishlist(req.user._id);
  res.status(200).json({
    success: true,
    message: "Added to wishlist",
    wishlist: user.wishlist,
  });
});

// ── DELETE /wishlist/:productId ────────────────────────────────────────────────
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  // Check the product is actually in the wishlist before pulling
  const inWishlist = await User.exists({
    _id: req.user._id,
    wishlist: productId,
  });
  if (!inWishlist) {
    return res
      .status(404)
      .json({ success: false, message: "Product not in wishlist" });
  }

  // $pull removes atomically
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: productId },
  });

  const user = await populateWishlist(req.user._id);
  res.status(200).json({
    success: true,
    message: "Removed from wishlist",
    wishlist: user.wishlist,
  });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
