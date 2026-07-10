const Joi = require("joi");
const { Permission } = require("../models");

const createPermissionSchema = Joi.object({
    action: Joi.string().required().messages({
        "string.empty": "Action is required",
    }),
    resource: Joi.string().required().messages({
        "string.empty": "Resource is required",
    }),
});

const updatePermissionSchema = Joi.object({
    action: Joi.string().optional(),
    resource: Joi.string().optional(),
}).or("action", "resource").messages({
    "object.missing": "At least one field (action or resource) must be provided",
});

const isPermissionUnique = async (action, resource, excludeId = null) => {
    const whereClause = excludeId
        ? {
            action,
            resource,
            permission_id: { [Op.ne]: excludeId },
        }
        : { action, resource };

    const permission = await Permission.findOne({ where: whereClause });
    return !permission;
};

const validateCreatePermission = async (req, res, next) => {
    const { error } = createPermissionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { action, resource } = req.body;
    const isUnique = await isPermissionUnique(action, resource);
    if (!isUnique) {
        return res
            .status(409)
            .json({ error: "Permission with this action and resource already exists" });
    }

    next();
};

const validateUpdatePermission = async (req, res, next) => {
    const { error } = updatePermissionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    if (req.body.action && req.body.resource) {
        const { id } = req.params;
        const isUnique = await isPermissionUnique(req.body.action, req.body.resource, id);
        if (!isUnique) {
            return res
                .status(409)
                .json({ error: "Permission with this action and resource already exists" });
        }
    }

    next();
};

module.exports = {
    validateCreatePermission,
    validateUpdatePermission,
};
