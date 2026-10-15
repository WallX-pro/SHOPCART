// routes/product.routes.js
// POST /products is public for this lab only.
// Note in README (already done): should be admin-only in production.

const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  createProductValidators,
} = require("../controllers/product.controller");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.post("/", createProductValidators, validate, createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
