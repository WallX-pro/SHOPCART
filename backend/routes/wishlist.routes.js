// routes/wishlist.routes.js
// All wishlist routes require authentication — user identity comes from JWT.
// No /wishlist/:userId pattern — the userId is always inferred from req.user.

const express = require("express");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlist.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes protected
router.use(protect);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
