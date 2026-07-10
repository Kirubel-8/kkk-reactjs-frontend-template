const Joi = require("joi");

const createCaseAttachmentSchema = Joi.object({
  case_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  file_name: Joi.string().required().messages({ "string.empty": "File name is required" }),
  file_path: Joi.string().required().messages({ "string.empty": "File path is required" }),
  file_status: Joi.string().valid("pending","approved","returned").optional(),
  description: Joi.string().optional(),
  uploaded_by: Joi.string().guid({ version: ["uuidv4"] }).optional(),
});

const updateCaseAttachmentSchema = Joi.object({
  file_name: Joi.string().optional(),
  file_path: Joi.string().optional(),
  file_status: Joi.string().valid("pending","approved","returned").optional(),
  description: Joi.string().optional(),
});

exports.validateCreateCaseAttachment = (req, res, next) => {
  const { error } = createCaseAttachmentSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateCaseAttachment = (req, res, next) => {
  const { error } = updateCaseAttachmentSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
