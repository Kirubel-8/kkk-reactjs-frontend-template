const Joi = require("joi");

const createComplaintWitnessSchema = Joi.object({
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).required(),
  witness_name: Joi.string().required().messages({ "string.empty": "Witness name is required" }),
  witness_address: Joi.string().required().messages({ "string.empty": "Witness address is required" }),
  witness_signature: Joi.string().optional(),
});

const updateComplaintWitnessSchema = Joi.object({
  witness_name: Joi.string().optional(),
  witness_address: Joi.string().optional(),
  witness_signature: Joi.string().optional(),
});

exports.validateCreateComplaintWitness = (req, res, next) => {
  const { error } = createComplaintWitnessSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateComplaintWitness = (req, res, next) => {
  const { error } = updateComplaintWitnessSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
