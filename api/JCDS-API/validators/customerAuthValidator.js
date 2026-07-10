const Joi = require("joi");

const signInSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

exports.validateCustomerAuth = (req, res, next) => {
  const { error } = signInSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ errors: error.details.map((err) => err.message) });
  }
  next();
};
