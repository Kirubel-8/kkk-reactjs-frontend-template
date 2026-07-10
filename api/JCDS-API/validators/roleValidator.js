const Joi = require("joi");

const createRoleSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Role name is required",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Role description is required",
  }),

  permissions: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .messages({
      "string.guid": "Each permission must be a valid UUID",
    }),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().optional(),

  description: Joi.string().optional(),

  permissions: Joi.array()
    .items(Joi.string().guid({ version: "uuidv4" }))
    .optional()
    .messages({
      "string.guid": "Each permission must be a valid UUID",
    }),
});

exports.validateCreateRole = (req, res, next) => {
  const { error } = createRoleSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

exports.validateUpdateRole = (req, res, next) => {
  const { error } = updateRoleSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};
