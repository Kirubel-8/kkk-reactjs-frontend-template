const Joi = require("joi");
const { CustomerAccount } = require("../models");

const createCustomerSchema = Joi.object({
  first_name: Joi.string().allow(null, '').optional(),
  middle_name: Joi.string().optional(),
  last_name: Joi.string().allow(null, '').optional(),
  gender: Joi.string()
    .valid("Male", "Female")
    .required()
    .messages({
      "any.only": "Gender must be either Male or Female",
      "string.empty": "Gender is required",
    }),
  // email: Joi.string().email().required().messages({
  //   "string.email": "Invalid email format",
  //   "string.empty": "Email is required",
  // }),
  // email: Joi.string().email().optional(),
  email: Joi.string().email().allow(null, '').optional(),
  phone_number: Joi.string()
  // .pattern(/^\d+$/)
  .pattern(/^\+?\d+$/) // allows optional '+' at the start
  .required().messages({
    "string.pattern.base": "Phone number must be numeric",
    "string.empty": "Phone number is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.empty": "Password is required",
  }),
  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords must match",
      "string.empty": "Confirm password is required",
    }),
});

// const verifyOTPSchema = Joi.object({
//   email: Joi.string().email().required().messages({
//     "string.email": "Invalid email format",
//     "string.empty": "Email is required",
//   }),
//   otp: Joi.string().length(6).required().messages({
//     "string.length": "OTP must be 6 characters long",
//     "string.empty": "OTP is required",
//   }),
// });

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().allow(null, '').optional(),
  phone_number: Joi.string().optional(),
  otp: Joi.string().length(6).required(),
})
  .or("email", "phone_number") // require one of them
  .messages({
    "object.missing": "Either email or phone_number is required",
  });

const updateCustomerSchema = Joi.object({
  new_password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.empty": "Password is required",
  }),

  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Passwords must match",
      "string.empty": "Confirm password is required",
    }),

    current_password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
    }),
});

const validateCreateCustomer = async (req, res, next) => {
  const { error } = createCustomerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    // const existingCustomer = await CustomerAccount.findOne({
    //   where: { email: req.body.email },
    // });
    // if (existingCustomer) {
    //   return res
    //     .status(400)
    //     .json({ error: "Customer with this email already exists" });
    // }
    if (req.body.email) {
      const existingWithEmail = await CustomerAccount.findOne({
        where: { email: req.body.email },
      });
      if (existingWithEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }    
  } catch (err) {
    return res.status(500).json({ error: "Error checking existing customer" });
  }

  next();
};

const validateVerifyOTP = (req, res, next) => {
  const { error } = verifyOTPSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateUpdateCustomer = async (req, res, next) => {
  const { error } = updateCustomerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  createCustomerSchema,
  verifyOTPSchema,
  updateCustomerSchema,
  validateCreateCustomer,
  validateVerifyOTP,
  validateUpdateCustomer,
};
