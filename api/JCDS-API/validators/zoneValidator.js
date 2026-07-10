const Joi = require("joi");

const zoneSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        "string.empty": "Zone name is required",
    }),
    region_id: Joi.string()
        .guid({ version: "uuidv4" })
        .required()
        .messages({
            "string.empty": "Region ID is required",
            "string.guid": "Region ID must be a valid UUID",
        }),
});

exports.validateCreateZone = (req, res, next) => {
    const { error } = zoneSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

const updateZoneSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        "string.empty": "Zone name is required",
    }),
    regionId: Joi.string()
        .guid({ version: "uuidv4" })
        .required()
        .messages({
            "string.empty": "Region ID is required",
            "string.guid": "Region ID must be a valid UUID",
        }),
});

exports.validateUpdateZone = (req, res, next) => {
    const { error } = updateZoneSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
