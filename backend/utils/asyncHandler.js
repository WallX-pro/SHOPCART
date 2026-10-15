// utils/asyncHandler.js
// Wraps an async route handler and forwards any thrown error to next().
// This eliminates repetitive try/catch blocks across every controller.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
