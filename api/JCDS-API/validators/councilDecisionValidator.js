
const Joi = require("joi");

const submitCouncilDecisionSchema = Joi.object({
  case_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  decision_status_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required(),
  comment: Joi.string().optional().allow(""),
  is_eligable: Joi.boolean().optional(),
});

exports.validateSubmitCouncilDecision = (req, res, next) => {
  const { error } = submitCouncilDecisionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
