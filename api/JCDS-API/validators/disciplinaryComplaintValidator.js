const Joi = require("joi");

// Complaint schema (without applicant_id)
const disciplinaryComplaintSchema = Joi.object({
    judge_name: Joi.string().min(3).required(),
    court_office: Joi.string().min(3).required(),
    file_number: Joi.string().min(3).required(),
    signature_url: Joi.string().uri().optional(),
    status: Joi.string()
        .valid(
            "pending",
            "rejected",
            "under_investigation",
            "accepted",
            "pending_director_approval",
            "under_council_review",
            "Decided",
            "returned"
        )
        .optional(),

    // Nested validation for issues & evidences
    issues: Joi.array().items(
        Joi.object({
            description: Joi.string().min(5).required(),
        })
    ).optional(),

    evidences: Joi.array().items(
        Joi.object({
            description: Joi.string().min(5).required(),
            file_url: Joi.string().uri().optional(),
        })
    ).optional(),
});

// Middleware wrapper
exports.validateComplaint = (req, res, next) => {
    const { error } = disciplinaryComplaintSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
};

// Middleware to parse JSON fields from multipart/form-data
exports.parseJsonFields = (req, res, next) => {
    ["issues", "evidences"].forEach(field => {
        if (req.body[field] && typeof req.body[field] === "string") {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (e) {
                return res.status(400).json({ error: `${field} must be a valid JSON array` });
            }
        }
    });
    next();
};