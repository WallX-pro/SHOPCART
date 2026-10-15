// models/product.model.js
//
// Design notes:
//  - Text index on `name` enables $text search (fast, case-insensitive).
//  - Regular index on `category` speeds up category filter queries.
//  - `stock` has min:0 — goes to 0 but never negative (enforced atomically
//    in the order controller with $gte check).
//  - Price is always > 0 (validated). Subtotals are NEVER stored here;
//    they're computed server-side from latest price at checkout time.

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0.01, "Price must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["Electronics", "Fashion", "Books", "Home"],
        message: "Category must be Electronics, Fashion, Books, or Home",
      },
    },
    image: {
      type: String,
      required: [true, "Product image URL is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
  },
  { timestamps: true }
);

// Text index on name for fast case-insensitive search via $text operator.
// We also use escapeRegex + RegExp for partial matches — both approaches
// are supported; regex is used for ?search= queries (partial match friendlier).
productSchema.index({ name: "text" });

// Index on category for O(log n) category filter queries.
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);
