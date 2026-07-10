const Joi = require("joi");

const createComplaintEvidenceSchema = Joi.object({
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  file_type: Joi.string().required().messages({ "string.empty": "File type is required" }),
  file_path: Joi.string().required().messages({ "string.empty": "File path is required" }),
  status: Joi.string().valid("uploaded", "pending", "approved", "returned").optional(),
  uploaded_by: Joi.string().guid({ version: ["uuidv4"] }).required(),
  uploaded_at: Joi.date().iso().required(),
});

const updateComplaintEvidenceSchema = Joi.object({
  file_type: Joi.string().optional(),
  file_path: Joi.string().optional(),
  status: Joi.string().valid("uploaded", "pending", "approved", "returned").optional(),
});

exports.validateCreateComplaintEvidence = (req, res, next) => {
  const { error } = createComplaintEvidenceSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateComplaintEvidence = (req, res, next) => {
  const { error } = updateComplaintEvidenceSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
