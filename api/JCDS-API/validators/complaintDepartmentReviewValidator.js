const Joi = require("joi");

const createComplaintDepartmentReviewSchema = Joi.object({
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  case_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  department_head_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  comment: Joi.string().optional(),
  reviewed_at: Joi.date().iso().optional(),
});

const updateComplaintDepartmentReviewSchema = Joi.object({
  comment: Joi.string().optional(),
  reviewed_at: Joi.date().iso().optional(),
});

exports.validateCreateComplaintDepartmentReview = (req, res, next) => {
  const { error } = createComplaintDepartmentReviewSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateComplaintDepartmentReview = (req, res, next) => {
  const { error } = updateComplaintDepartmentReviewSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
