const Joi = require("joi");

const statusSchema = Joi.object({
  agenda_id: Joi.string().required().messages({
    "string.empty": "Agenda name is required",
  }),
  name: Joi.string().required().messages({
    "string.empty": "Agenda name is required",
  }),
  type: Joi.string().valid("committee", "council", "rejected").optional(),
  decision_type: Joi.string().valid("forward to judge", "forward to council office", "complaint closed", "back to committee", "back to council", "forward to committee", "forward to council").optional(),
  description: Joi.string().optional(),
  created_by: Joi.string().optional(),
  updated_by: Joi.string().optional(),
});

exports.validateStatusWithAgenda = (req, res, next) => {
  const { error } = statusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
