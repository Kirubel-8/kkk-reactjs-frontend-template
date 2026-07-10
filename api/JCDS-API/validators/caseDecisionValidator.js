const Joi = require("joi");

const createCaseDecisionSchema = Joi.object({
  case_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  letter_ref_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  decision_status: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  decision_document: Joi.string().optional(),
  external_decision: Joi.string().optional(),
  external_decision_document: Joi.string().optional(),
  // updated_by: Joi.string().guid({ version: ["uuidv4"] }).required(),
});

const updateCaseDecisionSchema = Joi.object({
  decision_status: Joi.string()
    .guid({ version: ["uuidv4"] })
    .optional(),
  decision_document: Joi.string().optional(),
  external_decision: Joi.string().optional(),
  external_decision_document: Joi.string().optional(),
});

exports.validateCreateCaseDecision = (req, res, next) => {
  const { error } = createCaseDecisionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateCaseDecision = (req, res, next) => {
  const { error } = updateCaseDecisionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
