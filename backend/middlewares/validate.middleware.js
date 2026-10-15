// middlewares/validate.middleware.js
// Reads the result of express-validator checks and converts failures into a
// standardised { success:false, message, errors:[{field,message}] } 400 response.
// This keeps validation concerns outside controllers.

const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });
};

module.exports = validate;
