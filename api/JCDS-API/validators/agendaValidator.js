const Joi = require("joi");

const agendaSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Agenda name is required",
    }),
    description: Joi.string().optional(),
    created_by: Joi.string().optional(),
    updated_by: Joi.string().optional(),
});

exports.validateAgenda = (req, res, next) => {
    const { error } = agendaSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
