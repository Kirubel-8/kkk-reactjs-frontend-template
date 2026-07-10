const Joi = require("joi");

const caseTypeSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Case Type name is required",
    }),
    created_by: Joi.string().optional(),
    updated_by: Joi.string().optional(),
});

exports.validateCaseType = (req, res, next) => {
    const { error } = caseTypeSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
