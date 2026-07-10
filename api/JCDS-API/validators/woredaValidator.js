const Joi = require("joi");


const createWoredaSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        "string.empty": "Woreda name is required",
    }),
    zone_id: Joi.alternatives()
        .try(
            Joi.string().guid({ version: "uuidv4" }),
            Joi.string().allow(""),
            Joi.allow(null)
        )
        .optional(),
    subcity_id: Joi.alternatives()
        .try(
            Joi.string().guid({ version: "uuidv4" }),
            Joi.string().allow(""),
            Joi.allow(null)
        )
        .optional(),
}).custom((value, helpers) => {
    
    const zone_id = value.zone_id === "" ? null : value.zone_id;
    const subcity_id = value.subcity_id === "" ? null : value.subcity_id;
    
    if ((zone_id && subcity_id) || (!zone_id && !subcity_id)) {
        return helpers.message(
            "A woreda must be associated with either zone_id or subcity_id, but not both."
        );
    }
    return {
        ...value,
        zone_id,
        subcity_id
    };
});

exports.validateCreateWoreda = (req, res, next) => {
    const { error, value } = createWoredaSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    // Update req.body with normalized values (empty strings converted to null)
    req.body = value;
    next();
};


const updateWoredaSchema = Joi.object({
    name: Joi.string().trim().optional(),
    zone_id: Joi.string()
        .guid({ version: "uuidv4" })
        .optional(),
});

exports.validateUpdateWoreda = (req, res, next) => {
    const { error } = updateWoredaSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
