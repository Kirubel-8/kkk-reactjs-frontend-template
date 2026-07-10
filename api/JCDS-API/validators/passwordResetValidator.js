const Joi = require("joi");

const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm password must match the new password",
      "any.required": "Confirm password is required",
    }),
});

exports.validatePasswordReset = (req, res, next) => {
  const { error } = passwordResetSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => err.message),
    });
  }
  next();
};
