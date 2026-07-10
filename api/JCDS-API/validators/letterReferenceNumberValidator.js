const Joi = require("joi");

const createLetterReferenceNumberSchema = Joi.object({
  reference_number: Joi.number().integer().required().messages({
    "number.base": "Reference number must be a number",
    "any.required": "Reference number is required",
  }),
});

const updateLetterReferenceNumberSchema = Joi.object({
  reference_number: Joi.number().integer().optional(),
});

exports.validateCreateLetterReferenceNumber = (req, res, next) => {
  const { error } = createLetterReferenceNumberSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateLetterReferenceNumber = (req, res, next) => {
  const { error } = updateLetterReferenceNumberSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
