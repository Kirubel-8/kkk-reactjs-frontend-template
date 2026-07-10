const Joi = require("joi");
const { User, Role } = require("../models");

const createUserSchema = Joi.object({
  first_name: Joi.string().required().messages({
    "string.empty": "First name is required",
  }),
  middle_name: Joi.string().optional(),
  last_name: Joi.string().required().messages({
    "string.empty": "Last name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),
  gender: Joi.string().valid("male", "female").optional().messages({
    "any.only": "Gender must be male or female",
  }),
  role_ids: Joi.array().items(Joi.string().guid()).optional().messages({
    "array.base": "Role IDs must be an array",
    "string.guid": "Each role ID must be a valid GUID",
    "number.base": "Each role ID must be a valid number",
  }),
});

const isEmailUnique = async (email) => {
  const user = await User.findOne({ where: { email } });
  return !user;
};

const validateCreateUser = async (req, res, next) => {
  const { error } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (req.body.email) {
    const isUnique = await isEmailUnique(req.body.email);
    if (!isUnique) {
      return res.status(400).json({ error: "Email already exists" });
    }
  }

  if (req.body.role_ids && req.body.role_ids.length > 0) {
    const roles = await Role.findAll({
      where: { role_id: req.body.role_ids },
    });

    if (roles.length !== req.body.role_ids.length) {
      return res.status(400).json({
        error: "Some of the provided role IDs are invalid or do not exist.",
      });
    }
  }

  next();
};

const updateUserSchema = Joi.object({
  first_name: Joi.string().optional(),
  middle_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  email: Joi.string().email().optional().messages({
    "string.email": "Invalid email format",
  }),
  gender: Joi.string().valid("male", "female").optional().messages({
    "any.only": "Gender must be male or female",
  }),
  role_ids: Joi.array().items(Joi.string().guid()).optional().messages({
    "array.base": "Role IDs must be an array",
    "string.guid": "Each role ID must be a valid GUID",
    "number.base": "Each role ID must be a valid number",
  }),
});

const validateUpdateUser = async (req, res, next) => {
  const { error } = updateUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (req.body.role_ids && req.body.role_ids.length > 0) {
    const roles = await Role.findAll({
      where: { role_id: req.body.role_ids },
    });

    if (roles.length !== req.body.role_ids.length) {
      return res.status(400).json({
        error: "Some of the provided role IDs are invalid or do not exist.",
      });
    }
  }

  next();
};

const updateProfileSchema = Joi.object({
  first_name: Joi.string().optional(),
  middle_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  email: Joi.string().email().optional().messages({
    "string.email": "Invalid email format",
  }),
  gender: Joi.string().valid("male", "female").optional().messages({
    "any.only": "Gender must be male or female",
  }),
});

const validateUpdateProfile = async (req, res, next) => {
  const { error } = updateProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (req.body.email) {
    const isUnique = await isEmailUnique(req.body.email);
    if (!isUnique) {
      return res.status(400).json({ error: "Email already exists" });
    }
  }

  next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateProfile,
};
