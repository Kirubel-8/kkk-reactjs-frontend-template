const Joi = require("joi");

const statusValues = [
  "pending",
  "rejected",
  "under_investigation",
  "accepted",
  "under_council_review",
  "Decided",
  "returned",
];

const createComplaintSchema = Joi.object({
  judge_name: Joi.string()
    .required()
    .messages({ "string.empty": "Judge name is required" }),
  judge_court: Joi.string()
    .required()
    .messages({ "string.empty": "Judge court is required" }),
  case_file_number: Joi.string().optional(),
  case_type: Joi.string().optional(),
  act_date: Joi.date()
    .iso()
    .required()
    .messages({ "date.base": "Act date must be a valid date" }),
  detailed_description: Joi.string()
    .required()
    .messages({ "string.empty": "Detailed description is required" }),
  damage_description: Joi.string().optional(),
  additional_explanation: Joi.string().optional(),
  // Allow complainant_address to be truly optional, including empty string from frontend
  complainant_address: Joi.string().allow("").optional(),
  // Allow court_office_id as optional UUID or empty string
  court_office_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .allow("", null)
    .optional()
    .messages({ "string.guid": "court_office_id must be a valid UUID" }),

  // Witness information
  witnesses: Joi.array().items(
    Joi.object({
      witness_name: Joi.string()
        .required()
        .messages({ "string.empty": "Witness name is required" }),
      // Phone number is required for new witnesses
      witness_phone_number: Joi.string()
        .required()
        .messages({ "string.empty": "Witness phone number is required" }),
    })
  ),
});

const updateComplaintSchema = Joi.object({
  // updatable fields
  judge_name: Joi.string(),
  judge_court: Joi.string(),
  case_file_number: Joi.string(),
  case_type: Joi.string(),
  act_date: Joi.date()
    .iso()
    .messages({ "date.base": "Act date must be a valid date" }),
  detailed_description: Joi.string(),
  damage_description: Joi.string().optional(),
  additional_explanation: Joi.string().optional(),
  // Also allow empty string when updating
  complainant_address: Joi.string().allow(""),
  // Allow court_office_id as optional UUID or empty string
  court_office_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .allow("", null)
    .optional()
    .messages({ "string.guid": "court_office_id must be a valid UUID" }),
  witnesses: Joi.array().items(
    Joi.object({
      complaint_witness_id: Joi.string()
        .guid({ version: ["uuidv4"] })
        .optional(),
      witness_name: Joi.string(),
      witness_phone_number: Joi.string(),
    })
  ),

  remove_witness_ids: Joi.array()
    .items(Joi.string().guid({ version: ["uuidv4"] }))
    .optional(),
  remove_evidence_ids: Joi.array()
    .items(Joi.string().guid({ version: ["uuidv4"] }))
    .optional(),

  // User id of the employee assigned to this complaint - the one that fetched this complaint
  get_user_id: Joi.string()
    .guid({ version: ["uuidv4"] })
    .messages({ "string.guid": "get_user_id must be a valid UUID" }),
  status: Joi.string()
    .valid(...statusValues)
    .messages({ "any.only": "Invalid status" }),
});

exports.validateCreateComplaint = (req, res, next) => {
  // Normalize multipart 'witnesses' (often arrives as a JSON string)
  if (typeof req.body.witnesses === "string") {
    try {
      const parsed = JSON.parse(req.body.witnesses);
      if (Array.isArray(parsed)) req.body.witnesses = parsed;
    } catch (_) {
      // leave as-is; Joi will report a clear validation error
    }
  }
  const { error } = createComplaintSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateComplaint = (req, res, next) => {
  try {
    if (typeof req.body.witnesses === "string") {
      const parsed = JSON.parse(req.body.witnesses);
      if (Array.isArray(parsed)) req.body.witnesses = parsed;
    }
    if (typeof req.body.remove_witness_ids === "string") {
      const parsed = JSON.parse(req.body.remove_witness_ids);
      if (Array.isArray(parsed)) req.body.remove_witness_ids = parsed;
    }
    if (typeof req.body.remove_evidence_ids === "string") {
      const parsed = JSON.parse(req.body.remove_evidence_ids);
      if (Array.isArray(parsed)) req.body.remove_evidence_ids = parsed;
    }
  } catch (_) {
    // leave as-is; Joi will report a clear validation error
  }
  const { error } = updateComplaintSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
