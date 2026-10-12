const { validationResult } = require('express-validator');

// Run after express-validator chains: 400 with the first message for display
// plus per-field details for forms.
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ message: errors[0].message, errors });
}

module.exports = validate;
