const Joi = require("joi");

const createCouncilMembersReviewSchema = Joi.object({
  case_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  council_head_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  council_member_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  assigned_at: Joi.date().iso().optional(),
  is_eligable: Joi.boolean().optional(),
  decision: Joi.string().required().messages({ "string.empty": "Decision is required" }),
  comment: Joi.string().required().messages({ "string.empty": "Comment is required" }),
  reviewed_at: Joi.date().iso().optional(),
});

const updateCouncilMembersReviewSchema = Joi.object({
  council_member_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  assigned_at: Joi.date().iso().optional(),
  is_eligable: Joi.boolean().optional(),
  decision: Joi.string().optional(),
  comment: Joi.string().optional(),
  reviewed_at: Joi.date().iso().optional(),
});

exports.validateCreateCouncilMembersReview = (req, res, next) => {
  const { error } = createCouncilMembersReviewSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateCouncilMembersReview = (req, res, next) => {
  const { error } = updateCouncilMembersReviewSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
