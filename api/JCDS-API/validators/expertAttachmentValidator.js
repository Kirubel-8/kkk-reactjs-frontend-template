const Joi = require("joi");

const expertAttachmentSchema = Joi.object({
    caseId: Joi.string().uuid().required().messages({
        "string.guid": "Case ID must be a valid UUID",
        "any.required": "Case ID is required"
    }),
    description: Joi.string().max(1000).optional().messages({
        "string.max": "Description cannot exceed 1000 characters"
    })
});

const attachmentStatusSchema = Joi.object({
    document_status: Joi.string().valid('approved', 'returned').required().messages({
        "any.only": "Document status must be either 'approved' or 'returned'",
        "any.required": "Document status is required"
    }),
    review_notes: Joi.string().max(500).optional().messages({
        "string.max": "Review notes cannot exceed 500 characters"
    })
});

exports.validateExpertAttachment = (req, res, next) => {
    const { error } = expertAttachmentSchema.validate(req.body);
    if (error) {
        // Clean up uploaded files if validation fails
        if (req.files) {
            req.files.forEach(file => {
                const fs = require('fs');
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        return res.status(400).json({
            success: false,
            errors: error.details.map(err => err.message)
        });
    }
    next();
};

exports.validateAttachmentStatus = (req, res, next) => {
    const { error } = attachmentStatusSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            errors: error.details.map(err => err.message)
        });
    }
    next();
};