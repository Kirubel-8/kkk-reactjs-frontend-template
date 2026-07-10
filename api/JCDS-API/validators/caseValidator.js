const Joi = require("joi");

const createCaseSchema = Joi.object({
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  case_number: Joi.string().required().messages({ "string.empty": "Case number is required" }),
  case_type: Joi.string().guid({ version: ["uuidv4"] }).required(),
  status: Joi.string().optional(),
});

const updateCaseSchema = Joi.object({
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  case_number: Joi.string().optional(),
  case_type: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  status: Joi.string().optional(),
});

exports.validateCreateCase = (req, res, next) => {
  const { error } = createCaseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateCase = (req, res, next) => {
  const { error } = updateCaseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
