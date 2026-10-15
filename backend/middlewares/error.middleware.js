// middlewares/error.middleware.js
// Central error handler — all errors forwarded via next(err) land here.
//
// Design notes:
//  - Mongoose CastError (invalid ObjectId) → 400 so clients know the id shape.
//  - Mongo duplicate key (11000) → 409 Conflict with which field duplicated.
//  - Mongoose ValidationError → 400 with individual field messages.
//  - All unknown errors default to 500 and hide implementation details in prod.

const errorHandler = (err, req, res, next) => {
  // Log in development for full visibility; silence in production to reduce noise.
  if (process.env.NODE_ENV !== "production") {
    console.error("🔴 Error:", err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors; // field-level validation errors array

  // ── Mongoose: invalid ObjectId ────────────────────────────────────────────
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // ── MongoDB: duplicate key ────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists`;
  }

  // ── Mongoose: schema validation ───────────────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── express-validator: forwarded validation result ────────────────────────
  if (err.isValidation) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.errors;
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
