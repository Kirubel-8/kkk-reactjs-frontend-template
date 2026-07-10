const Joi = require("joi");

const createNotificationSchema = Joi.object({
  case_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  recipient_customer_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  recipient_user_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  sender_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  type: Joi.string().valid("system","email","sms","in_app").optional(),
  title: Joi.string().required().messages({ "string.empty": "Title is required" }),
  message: Joi.string().required().messages({ "string.empty": "Message is required" }),
  is_read: Joi.boolean().optional(),
});

const updateNotificationSchema = Joi.object({
  case_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  complaint_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  recipient_customer_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  recipient_user_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  sender_id: Joi.string().guid({ version: ["uuidv4"] }).optional(),
  type: Joi.string().valid("system","email","sms","in_app").optional(),
  title: Joi.string().optional(),
  message: Joi.string().optional(),
  is_read: Joi.boolean().optional(),
});

exports.validateCreateNotification = (req, res, next) => {
  const { error } = createNotificationSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateNotification = (req, res, next) => {
  const { error } = updateNotificationSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
