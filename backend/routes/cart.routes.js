// routes/cart.routes.js
// All cart routes require authentication.
// validate middleware converts express-validator errors to the standard shape.

const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateQtyValidators,
} = require("../controllers/cart.controller");
const { protect }  = require("../middlewares/auth.middleware");
const validate     = require("../middlewares/validate.middleware");

const router = express.Router();

router.use(protect);

router.get("/",                              getCart);
router.post("/:productId",                   addToCart);
router.patch("/:productId", updateQtyValidators, validate, updateCartItem);
router.delete("/:productId",                 removeFromCart);

module.exports = router;
