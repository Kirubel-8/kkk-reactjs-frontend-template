const Joi = require("joi");
const { Depratment } = require("../models");

const createDepartmentSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Department name is required",
    }),
});

const updateDepartmentSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Department name is required",
    }),
});

exports.validateCreateDepartment = (req, res, next) => {
    const { error } = createDepartmentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

exports.validateUpdateDepartment = (req, res, next) => {
    const { error } = updateDepartmentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
