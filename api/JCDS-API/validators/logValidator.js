const Joi = require("joi");

const createLogSchema = Joi.object({
  case_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  reference_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  user_log_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  action: Joi.string().required().messages({ "string.empty": "Action is required" }),
  description: Joi.string().optional(),
  ip_address: Joi.string().optional(),
  user_agent: Joi.string().optional(),
});

const updateLogSchema = Joi.object({
  action: Joi.string().optional(),
  description: Joi.string().optional(),
  ip_address: Joi.string().optional(),
  user_agent: Joi.string().optional(),
});

exports.validateCreateLog = (req, res, next) => {
  const { error } = createLogSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateLog = (req, res, next) => {
  const { error } = updateLogSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
