const Joi = require("joi");

const createTeamSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Team name is required",
  }),
  department_id: Joi.string().uuid().required().messages({
    "string.uuid": "A valid department ID is required",
  }),
  created_by: Joi.string().optional(),
  updated_by: Joi.string().optional(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Team name is required",
  }),
  department_id: Joi.string().uuid().optional().messages({
    "string.uuid": "A valid department ID is required if provided",
  }),
  created_by: Joi.string().optional(),
  updated_by: Joi.string().optional(),
});

exports.validateCreateTeam = (req, res, next) => {
  const { error } = createTeamSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

exports.validateUpdateTeam = (req, res, next) => {
  const { error } = updateTeamSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
