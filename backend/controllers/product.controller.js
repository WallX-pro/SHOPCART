// controllers/product.controller.js
//
// Design notes:
//  - search uses RegExp with escapeRegex() — not $text — so partial matches
//    work (e.g. "lap" matches "Laptop"). escapeRegex prevents ReDoS attacks.
//  - sort, category, search are combined into a single Mongoose query object
//    built dynamically; this avoids multiple round-trips to MongoDB.
//  - Pagination: default page=1, limit=12; returned alongside count/total
//    so the frontend can build page controls.
//  - POST /products is intentionally public for this lab. In production it
//    would require an admin role check (e.g., req.user.role === 'admin').

const mongoose = require("mongoose");
const { body, query } = require("express-validator");
const Product     = require("../models/product.model");
const asyncHandler = require("../utils/asyncHandler");
const escapeRegex  = require("../utils/escapeRegex");

// ── Validators ─────────────────────────────────────────────────────────────────
const createProductValidators = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a number greater than 0"),
  body("category")
    .isIn(["Electronics", "Fashion", "Books", "Home"])
    .withMessage("Category must be Electronics, Fashion, Books, or Home"),
  body("image").trim().notEmpty().withMessage("Image URL is required"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

// ── Controllers ────────────────────────────────────────────────────────────────

/**
 * POST /products
 * Creates a product. Public in this lab; should be admin-only in production.
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, image, stock } = req.body;
  const product = await Product.create({ name, description, price, category, image, stock });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

/**
 * GET /products
 * Supports: ?search=, ?category=, ?sort=price_asc|price_desc, ?page=, ?limit=
 *
 * Query building is dynamic — we only add filters that the client actually
 * sent so the Mongo query stays as lean as possible.
 */
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, sort, page, limit } = req.query;

  // ── Build filter object ──────────────────────────────────────────────────
  const filter = {};

  if (search && search.trim()) {
    // Escape user input before embedding in RegExp to prevent ReDoS.
    // 'i' flag = case-insensitive; matches partial names (substring match).
    filter.name = new RegExp(escapeRegex(search.trim()), "i");
  }

  if (category && category !== "All") {
    // Validate category to avoid garbage queries
    const validCategories = ["Electronics", "Fashion", "Books", "Home"];
    if (validCategories.includes(category)) {
      filter.category = category;
    }
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  let sortOption = { createdAt: -1 }; // default: newest first
  if (sort === "price_asc")  sortOption = { price: 1 };
  if (sort === "price_desc") sortOption = { price: -1 };

  // ── Pagination ────────────────────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
  const skip     = (pageNum - 1) * limitNum;

  // Run count and products query in parallel for performance
  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    products,
  });
});

/**
 * GET /products/:id
 * Returns a single product. 400 for invalid ObjectId, 404 if not found.
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId shape before hitting Mongoose (which would throw CastError)
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  res.status(200).json({ success: true, product });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  createProductValidators,
};
