const { sequelize, DisciplinaryComplaint, DisciplinaryComplaintIssue, DisciplinaryComplaintEvidence, CustomerAccount, ComplaintHasRejection, ComplaintWitness, ComplaintEvidenceHasRejection, Case, CaseDecision, StatusWithAgenda, LetterReferenceNumber, CaseDecisionLetter, User, CourtOffice, CourtCategory } = require("../models");
// const { isUuid } = require("uuidv4"); 
const { v4: uuidv4, validate: isUuid } = require("uuid");
const path = require("path");
const { Op } = require("sequelize");
const fs = require("fs");

const { disciplinaryComplaintSchema, disciplinaryComplaintIssueSchema, disciplinaryComplaintEvidenceSchema } = require("../validators/disciplinaryComplaintValidator");
const { uploadSignature, uploadEvidence, uploadMultiple } = require("../middleware/disciplinaryFileUploadMiddleware");

// =====================  Disciplinary Complaint CRUD =====================

exports.discliplinaryComplaintRequest = async (req, res) => {
    uploadMultiple(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        const t = await sequelize.transaction();
        try {
            const { judge_name, court_office, court_office_id, file_number, status, issues, evidences, witnesses } = req.body;
            const applicant_id = req.user?.id;

            if (!applicant_id) {
                return res.status(404).json({ error: "You are not Logged in" });
            }

            // Parse JSON arrays if they come as strings
            const issuesArray = typeof issues === 'string' ? JSON.parse(issues) : issues || [];
            const evidencesArray = typeof evidences === 'string' ? JSON.parse(evidences) : evidences || [];
            const witnessesArray = typeof witnesses === 'string' ? JSON.parse(witnesses) : witnesses || [];

            // Verify applicant exists
            const applicant = await CustomerAccount.findByPk(applicant_id);
            if (!applicant) {
                await t.rollback();
                return res.status(404).json({ error: "Applicant not found" });
            }

            const complaintId = uuidv4();
            const signatureUrl = req.files && req.files.signature ?
                req.files.signature[0].path.replace(/^public/, '') : null;

            // Create complaint
            const complaint = await DisciplinaryComplaint.create({
                disciplinary_complaint_id: complaintId,
                applicant_id,
                judge_name,
                court_office,
                court_office_id: court_office_id || null,
                file_number,
                signature_url: signatureUrl,
                status: status || 'pending',
            }, { transaction: t });

            // Insert issues
            if (issuesArray.length > 0) {
                const issueRecords = issuesArray.map((issue) => ({
                    issue_id: uuidv4(),
                    disciplinary_complaint_id: complaintId,
                    description: issue.description,
                }));
                await DisciplinaryComplaintIssue.bulkCreate(issueRecords, { transaction: t });
            }

            // Handle evidences - ONLY ONE description evidence allowed
            const evidenceRecords = [];
            let descriptionEvidenceAdded = false;

            // Process evidences from JSON
            evidencesArray.forEach(evi => {
                if (evi.description && !descriptionEvidenceAdded) {

                    evidenceRecords.push({
                        evidence_id: uuidv4(),
                        disciplinary_complaint_id: complaintId,
                        description: evi.description, // Only one description evidence
                        file_url: null,
                    });
                    descriptionEvidenceAdded = true;
                } else if (evi.file_url) {
                    // Add file URL evidence
                    evidenceRecords.push({
                        evidence_id: uuidv4(),
                        disciplinary_complaint_id: complaintId,
                        description: null,
                        file_url: evi.file_url,
                    });
                }
                // no more than one desc
            });


            if (req.files && req.files.evidence) {
                req.files.evidence.forEach(file => {
                    evidenceRecords.push({
                        evidence_id: uuidv4(),
                        disciplinary_complaint_id: complaintId,
                        description: null,
                        file_url: file.path.replace(/^public/, ''),
                    });
                });
            }

            // Only bulkCreate if we have records
            if (evidenceRecords.length > 0) {
                await DisciplinaryComplaintEvidence.bulkCreate(evidenceRecords, { transaction: t });
            }

            // Handle witnesses
            if (witnessesArray.length > 0) {
                const witnessRecords = witnessesArray.map((witness) => ({
                    complaint_witness_id: uuidv4(),
                    disciplinary_id: complaintId,
                    complaint_id: null,
                    witness_name: witness.witness_name,
                    witness_address: witness.witness_address,
                    witness_phone_number: witness.witness_phone_number || null,
                    witness_signature: witness.witness_signature || null,
                }));
                await ComplaintWitness.bulkCreate(witnessRecords, { transaction: t });
            }

            await t.commit();

            // Fetch Disciplinary complaint with relations
            const completeComplaint = await DisciplinaryComplaint.findByPk(complaintId, {
                include: [
                    { model: DisciplinaryComplaintIssue, as: 'issues' },
                    { model: DisciplinaryComplaintEvidence, as: 'evidences' },
                    {
                        model: ComplaintWitness,
                        as: 'witnesses',
                        attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature']
                    },
                    {
                        model: CustomerAccount,
                        as: 'applicant',
                        attributes: ['full_name', 'email', 'phone_number']
                    }
                ]
            });

            res.status(201).json({
                message: "Complaint created successfully with files",
                complaint: completeComplaint
            });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ error: error.message });
        }
    });
};

// Get all complaints with pagination and filters
exports.getDiscliplinaryComplaintRequest = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, applicant_id, judge_name } = req.query;
        const offset = (page - 1) * limit;

        const customerId = req?.user?.id;
        if (!customerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const whereClause = {};
        if (status) whereClause.status = status;
        if (applicant_id) {
            whereClause.applicant_id = applicant_id;
        } else {
            whereClause.applicant_id = customerId;
        }
        if (judge_name) whereClause.judge_name = {
            [Op.like]: `%${judge_name}%`
        };

        const { count, rows } = await DisciplinaryComplaint.findAndCountAll({
            where: whereClause,
            distinct: true,
            include: [{
                model: CustomerAccount,
                as: 'applicant',
                attributes: ['full_name', 'email']
            },
            {
                model: DisciplinaryComplaintIssue,
                as: 'issues',
                attributes: ['issue_id', 'description']
            },
            {
                model: ComplaintWitness,
                as: 'witnesses',
                attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature'],
            },
            {
                model: DisciplinaryComplaintEvidence,
                as: 'evidences',
                attributes: ['evidence_id', 'description', 'file_url']
            },
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });


        res.status(200).json({
            discliplinary_complaints: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalCount: count,
                hasNext: (page * limit) < count,
                hasPrev: page > 1
            }
        });

    } catch (err) {
        console.error("Error in getDiscliplinaryComplaintRequest:", err);
        res.status(500).json({
            error: "Internal server error",
            message: err.message
        });
    }
};

// Get complaint by ID with full details
exports.getDiscliplinaryComplaintRequestById = async (req, res) => {
    try {
        const complaint = await DisciplinaryComplaint.findByPk(req.params.id, {
            include: [{
                model: CustomerAccount,
                as: 'applicant',
                attributes: ['full_name', 'email', 'phone_number', 'img_url']
            },
            {
                model: DisciplinaryComplaintIssue,
                as: 'issues'
            },
            {
                model: DisciplinaryComplaintEvidence,
                as: 'evidences'
            },
            {
                model: ComplaintWitness,
                as: 'witnesses',
                attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature']
            },
            {
                model: ComplaintHasRejection,
                as: 'disciplinaryRejection'
            },
            {
                model: CourtOffice,
                as: 'courtOffice',
                required: false,
                attributes: ['court_office_id', 'name'],
                include: [{
                    model: CourtCategory,
                    as: 'category',
                    required: false,
                    attributes: ['court_category_id', 'name']
                }]
            },
            {
                model: Case,
                as: 'case',
                required: false,
                include: [
                    {
                        model: CaseDecision,
                        as: 'decision',
                        required: false,
                        include: [
                            {
                                model: StatusWithAgenda,
                                as: 'status',
                                attributes: ['status_id', 'name', 'decision_type'],
                            },
                            {
                                model: LetterReferenceNumber,
                                as: 'letterRef',
                                attributes: ['reference_id', 'reference_number'],
                            },
                            {
                                model: CaseDecisionLetter,
                                as: 'letters',
                                attributes: ['decision_letter_id', 'letter_type', 'letter_content', 'status', 'created_at'],
                            },
                        ],
                    },
                ],
            }
            ]
        });

        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found." });
        }

        res.status(200).json(complaint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update complaint signature
exports.uploadSignature = async (req, res) => {
    uploadSignature(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const complaint = await DisciplinaryComplaint.findByPk(req.params.id);
            if (!complaint) {
                return res.status(404).json({ error: "Complaint not found." });
            }

            const signatureUrl = req.file ? req.file.path.replace(/^public/, '') : null;

            await complaint.update({
                signature_url: signatureUrl
            });

            res.status(200).json({
                message: "Signature uploaded successfully",
                signature_url: signatureUrl
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

// Add evidence with file upload
exports.addEvidenceWithFile = async (req, res) => {
    uploadEvidence(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { description } = req.body;
            const complaintId = req.params.id;

            const complaint = await DisciplinaryComplaint.findByPk(complaintId);
            if (!complaint) {
                return res.status(404).json({ error: "Complaint not found." });
            }

            const fileUrl = req.file ? req.file.path.replace(/^public/, '') : null;

            const evidence = await DisciplinaryComplaintEvidence.create({
                evidence_id: uuidv4(),
                disciplinary_complaint_id: complaintId,
                description: description || `Uploaded file: ${req.file.originalname}`,
                file_url: fileUrl,
            });

            res.status(201).json({
                message: "Evidence added successfully",
                evidence
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

// Update complaint status
exports.updateDiscliplinaryComplaintRequestStatus = async (req, res) => {
    try {
        const { status, get_user_id } = req.body;
        const validStatuses = ['pending', 'rejected', 'under_investigation', 'accepted', 'under_council_review', 'Decided', 'returned'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const complaint = await DisciplinaryComplaint.findByPk(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found." });
        }

        await complaint.update({
            status,
            get_user_id: get_user_id || null
        });

        res.status(200).json({
            message: "Complaint status updated successfully",
            complaint
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete evidence and associated file
exports.deleteEvidence = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const evidence = await DisciplinaryComplaintEvidence.findByPk(req.params.id);
        if (!evidence) {
            await t.rollback();
            return res.status(404).json({ error: "Evidence not found." });
        }

        // Delete physical file if exists
        if (evidence.file_url) {
            const fs = require('fs');
            const filePath = `./public${evidence.file_url}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await evidence.destroy({ transaction: t });
        await t.commit();

        res.status(200).json({ message: "Evidence deleted successfully" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

// Get complaints by applicant
exports.getComplaintsByApplicant = async (req, res) => {
    try {
        // Get logged-in user's ID
        const applicant_id = req.user?.id;

        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await DisciplinaryComplaint.findAndCountAll({
            where: { applicant_id },
            distinct: true,
            include: [{
                model: DisciplinaryComplaintIssue,
                as: 'issues',
                attributes: ['issue_id', 'description']
            },
            {
                model: DisciplinaryComplaintEvidence,
                as: 'evidences',
                attributes: ['evidence_id', 'description', 'file_url']
            },
            {
                model: ComplaintWitness,
                as: 'witnesses',
                attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature']
            }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['createdAt', 'DESC']
            ]
        });

        res.status(200).json({
            complaints: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalCount: count,
                hasNext: page * limit < count,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateComplaintWithFiles = async (req, res) => {
    uploadMultiple(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });

        const transaction = await sequelize.transaction();
        try {
            const { complaintId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                await transaction.rollback();
                return res.status(401).json({ message: "Unauthorized" });
            }

            if (!isUuid(complaintId)) {
                await transaction.rollback();
                return res.status(400).json({ message: "Invalid complaint id format" });
            }

            const complaint = await DisciplinaryComplaint.findByPk(complaintId, {
                include: [{
                    model: DisciplinaryComplaintEvidence,
                    as: 'evidences'
                }],
                transaction
            });
            if (!complaint) {
                await transaction.rollback();
                return res.status(404).json({ message: "Complaint not found" });
            }

            // Automatically handle rejected evidences with rejection reasons
            const rejectedEvidencesWithReason = complaint.evidences?.filter(
                ev => ev.file_status === "rejected" && ev.rejection_reason
            ) || [];

            if (rejectedEvidencesWithReason.length > 0) {
                for (const ev of rejectedEvidencesWithReason) {
                    // For text description (no file_url): update to pending and clear rejection reason
                    if (!ev.file_url) {
                        // Delete rejection reason records from ComplaintEvidenceHasRejection table
                        // await ComplaintEvidenceHasRejection.destroy({
                        //     where: { disciplinary_evidence_id: ev.evidence_id },
                        //     transaction,
                        // });

                        // Update evidence: set to pending and clear rejection reason
                        await ev.update({
                            file_status: "pending",
                            rejection_reason: null,
                            reviewed_by: null,
                            reviewed_at: null
                        }, { transaction });
                    } else {
                        // For file evidences: delete the file and evidence record
                        // Delete physical file if exists
                        const abs = path.join(__dirname, "..", "public", ev.file_url.replace(/^\//, ""));
                        if (fs.existsSync(abs)) {
                            try { fs.unlinkSync(abs); } catch (_) { }
                        }

                        // Delete rejection reason records from ComplaintEvidenceHasRejection table
                        // await ComplaintEvidenceHasRejection.destroy({
                        //     where: { disciplinary_evidence_id: ev.evidence_id },
                        //     transaction,
                        // });

                        // Delete the evidence record
                        await ev.destroy({ transaction });
                    }
                }
            }

            // ---------- Normalize arrays ----------
            const normalizeArray = (val) => {
                if (!val) return [];
                if (typeof val === "string") {
                    try {
                        return JSON.parse(val);
                    } catch {
                        return [];
                    }
                }
                return Array.isArray(val) ? val : [];
            };

            const issues = normalizeArray(req.body.issues);
            const evidences = normalizeArray(req.body.evidences);
            const witnesses = normalizeArray(req.body.witnesses);
            const removeIssueIds = normalizeArray(req.body.remove_issue_ids);
            const removeEvidenceIds = normalizeArray(req.body.remove_evidence_ids);
            const removeWitnessIds = normalizeArray(req.body.remove_witness_ids);

            // ---------- Update main complaint ----------
            const updatableFields = ["judge_name", "court_office", "court_office_id", "file_number"];
            const payload = {};
            for (const field of updatableFields) {
                if (req.body[field] !== undefined) payload[field] = req.body[field];
            }

            // If status is "returned", change it to "pending" when updating
            if (complaint.status === "returned") {
                payload.status = "under_investigation";
            }

            const signatureFile = req.files?.signature?.[0];
            if (signatureFile) {
                if (complaint.signature_url) {
                    const oldPath = path.join(__dirname, "..", "public", complaint.signature_url.replace(/^\//, ""));
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (_) { }
                    }
                }
                payload.signature_url = signatureFile.path.replace(/^public/, '');
            }

            await complaint.update(payload, { transaction });

            // ---------- Handle Issues ----------
            if (removeIssueIds.length > 0) {
                await DisciplinaryComplaintIssue.destroy({
                    where: { disciplinary_complaint_id: complaintId, issue_id: removeIssueIds },
                    transaction,
                });
            }

            if (issues.length > 0 && issues[0].description) {
                const issue = issues[0];
                const existing = await DisciplinaryComplaintIssue.findOne({
                    where: { disciplinary_complaint_id: complaintId },
                    transaction,
                });

                if (existing) {
                    await existing.update({ description: issue.description }, { transaction });
                } else {
                    await DisciplinaryComplaintIssue.create(
                        {
                            issue_id: uuidv4(),
                            disciplinary_complaint_id: complaintId,
                            description: issue.description,
                        },
                        { transaction }
                    );
                }
            }

            // ---------- Handle Evidence Removals ----------
            if (removeEvidenceIds.length > 0) {
                const evidencesToRemove = await DisciplinaryComplaintEvidence.findAll({
                    where: { disciplinary_complaint_id: complaintId, evidence_id: removeEvidenceIds },
                    transaction,
                });

                for (const ev of evidencesToRemove) {
                    if (ev.file_url) {
                        const abs = path.join(__dirname, "..", "public", ev.file_url.replace(/^\//, ""));
                        if (fs.existsSync(abs)) {
                            try { fs.unlinkSync(abs); } catch (_) { }
                        }
                    }
                    // Remove rejection reason when evidence is removed
                    if (ev.rejection_reason) {
                        ev.rejection_reason = null;
                        await ev.save({ transaction });
                    }
                }

                await DisciplinaryComplaintEvidence.destroy({
                    where: { disciplinary_complaint_id: complaintId, evidence_id: removeEvidenceIds },
                    transaction,
                });
            }

            // ---------- Update or Add Evidences ----------
            const uploadedEvidenceFiles = req.files?.evidence || [];
            const existingEvidences = await DisciplinaryComplaintEvidence.findAll({
                where: { disciplinary_complaint_id: complaintId },
                transaction,
            });

            for (const e of evidences) {
                if (e.evidence_id) {
                    const existing = existingEvidences.find(ev => ev.evidence_id === e.evidence_id);
                    if (existing) {
                        const updateData = {
                            description: e.description,
                            file_url: e.file_url || existing.file_url,
                            file_status: "pending" // Always reset to pending when updating
                        };
                        // Clear rejection reason and review info when updating
                        updateData.rejection_reason = null;
                        updateData.reviewed_by = null;
                        updateData.reviewed_at = null;
                        await existing.update(updateData, { transaction });
                    }
                } else if (e.description || e.file_url) {
                    await DisciplinaryComplaintEvidence.create(
                        {
                            evidence_id: uuidv4(),
                            disciplinary_complaint_id: complaintId,
                            description: e.description || null,
                            file_url: e.file_url || null,
                            file_status: "pending"
                        },
                        { transaction }
                    );
                }
            }

            if (uploadedEvidenceFiles.length > 0) {
                const newEvidenceRows = uploadedEvidenceFiles.map(file => ({
                    evidence_id: uuidv4(),
                    disciplinary_complaint_id: complaintId,
                    description: null,
                    file_url: file.path.replace(/^public/, ''),
                    file_status: "pending"
                }));
                await DisciplinaryComplaintEvidence.bulkCreate(newEvidenceRows, { transaction });
            }

            // ---------- Handle Witness Removals ----------
            if (removeWitnessIds.length > 0) {
                const witnessesToRemove = await ComplaintWitness.findAll({
                    where: { disciplinary_id: complaintId, complaint_witness_id: removeWitnessIds },
                    transaction,
                });

                for (const w of witnessesToRemove) {
                    if (w.witness_signature) {
                        const abs = path.join(__dirname, "..", "public", w.witness_signature.replace(/^\//, ""));
                        if (fs.existsSync(abs)) {
                            try { fs.unlinkSync(abs); } catch (_) { }
                        }
                    }
                }

                await ComplaintWitness.destroy({
                    where: { disciplinary_id: complaintId, complaint_witness_id: removeWitnessIds },
                    transaction,
                });
            }

            // ---------- Update or Add Witnesses ----------
            if (witnesses.length > 0) {
                const existingWitnesses = await ComplaintWitness.findAll({
                    where: { disciplinary_id: complaintId },
                    transaction,
                });

                for (const w of witnesses) {
                    if (w.complaint_witness_id) {
                        // Update existing witness
                        const existing = existingWitnesses.find(wit => wit.complaint_witness_id === w.complaint_witness_id);
                        if (existing) {
                            const updateData = {};
                            if (w.witness_name !== undefined) updateData.witness_name = w.witness_name;
                            if (w.witness_address !== undefined) updateData.witness_address = w.witness_address;
                            if (w.witness_phone_number !== undefined) updateData.witness_phone_number = w.witness_phone_number;
                            if (w.witness_signature !== undefined) updateData.witness_signature = w.witness_signature;
                            await existing.update(updateData, { transaction });
                        }
                    } else {
                        // Create new witness
                        await ComplaintWitness.create(
                            {
                                complaint_witness_id: uuidv4(),
                                disciplinary_id: complaintId,
                                complaint_id: null,
                                witness_name: w.witness_name,
                                witness_address: w.witness_address,
                                witness_phone_number: w.witness_phone_number || null,
                                witness_signature: w.witness_signature || null,
                            },
                            { transaction }
                        );
                    }
                }
            }

            await transaction.commit();

            const updatedComplaint = await DisciplinaryComplaint.findByPk(complaintId, {
                include: [
                    { model: DisciplinaryComplaintIssue, as: "issues" },
                    { model: DisciplinaryComplaintEvidence, as: "evidences" },
                    {
                        model: ComplaintWitness,
                        as: "witnesses",
                        attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature']
                    },
                    { model: CustomerAccount, as: "applicant", attributes: ["full_name", "email", "phone_number"] },
                ],
            });

            return res.status(200).json({
                message: "Complaint updated successfully",
                data: updatedComplaint,
            });
        } catch (error) {
            await transaction.rollback();
            console.error("Update complaint failed:", error);
            return res.status(500).json({ message: "Internal server error", error: error.message });
        }
    });
};




// ===================== DELETE DISCIPLINARY COMPLAINT =====================
exports.deleteDisciplinaryComplaint = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const customerId = req.user?.id;
        // Find complaint with associations
        const complaint = await DisciplinaryComplaint.findByPk(id, {
            include: [
                { model: DisciplinaryComplaintIssue, as: "issues" },
                { model: DisciplinaryComplaintEvidence, as: "evidences" },
                { model: ComplaintWitness, as: "witnesses" },
            ],
        });

        if (!complaint) {
            await t.rollback();
            return res.status(404).json({ error: "Complaint not found" });
        }
        if (complaint.applicant_id !== customerId) {
            await t.rollback();
            return res.status(403).json({ error: "You are not authorized to delete this complaint" });
        }
        // Delete related files (signature + evidence)
        if (complaint.signature_url) {
            const sigPath = path.join(__dirname, "..", complaint.signature_url);
            if (fs.existsSync(sigPath)) {
                fs.unlinkSync(sigPath);
            }
        }

        if (complaint.evidences && complaint.evidences.length > 0) {
            for (const evi of complaint.evidences) {
                if (evi.file_url) {
                    const eviPath = path.join(__dirname, "..", evi.file_url);
                    if (fs.existsSync(eviPath)) {
                        fs.unlinkSync(eviPath);
                    }
                }
            }
        }

        // Delete witness signature files
        if (complaint.witnesses && complaint.witnesses.length > 0) {
            for (const witness of complaint.witnesses) {
                if (witness.witness_signature) {
                    const witnessPath = path.join(__dirname, "..", "public", witness.witness_signature.replace(/^\//, ""));
                    if (fs.existsSync(witnessPath)) {
                        fs.unlinkSync(witnessPath);
                    }
                }
            }
        }

        // Delete related records (issues, evidences, witnesses)
        await DisciplinaryComplaintIssue.destroy({
            where: { disciplinary_complaint_id: id },
            transaction: t,
        });

        await DisciplinaryComplaintEvidence.destroy({
            where: { disciplinary_complaint_id: id },
            transaction: t,
        });

        await ComplaintWitness.destroy({
            where: { disciplinary_id: id },
            transaction: t,
        });

        // Delete main complaint
        await complaint.destroy({ transaction: t });

        await t.commit();

        res.status(200).json({ message: "Complaint and related records deleted successfully" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.modifyRejectedEvidence = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { evidence_id } = req.params;
        const { action } = req.body; // 'delete' | 'replace'
        const user_id = req.user?.id;

        console.log("=== MODIFY EVIDENCE DEBUG ===");
        console.log("Evidence ID:", evidence_id);
        console.log("Action:", action);
        console.log("User ID:", user_id);
        console.log("File uploaded:", !!req.file);

        if (!user_id) {
            console.log("No user ID - authentication failed");
            await t.rollback();
            return res.status(401).json({ error: "Authentication required" });
        }

        const evidence = await DisciplinaryComplaintEvidence.findByPk(evidence_id, {
            include: {
                model: DisciplinaryComplaint,
                as: "complaint",
                attributes: ["applicant_id", "status"]
            }
        });

        console.log("Found evidence:", evidence ? "Yes" : "No");
        if (evidence) {
            console.log("Evidence file_status:", evidence.file_status);
            console.log("Complaint applicant_id:", evidence.complaint?.applicant_id);
            console.log("Complaint status:", evidence.complaint?.status);
            console.log("User matches applicant:", evidence.complaint?.applicant_id === user_id);
        }

        if (!evidence) {
            console.log("Evidence not found");
            await t.rollback();
            return res.status(404).json({ error: "Evidence not found" });
        }

        // Check ownership
        if (evidence.complaint.applicant_id !== user_id) {
            console.log("Ownership check failed");
            await t.rollback();
            return res.status(403).json({ error: "You can only modify your own complaint evidence" });
        }

        // FIX: Update allowed statuses to include under_investigation
        const allowedStatuses = ['evidence_revision_required', 'under_review', 'under_investigation'];
        if (!allowedStatuses.includes(evidence.complaint.status)) {
            console.log("Status check failed. Current status:", evidence.complaint.status);
            console.log("Allowed statuses:", allowedStatuses);
            await t.rollback();
            return res.status(400).json({ error: "Cannot modify evidence in current complaint status" });
        }

        // Check if evidence is rejected
        if (evidence.file_status !== "rejected") {
            console.log("Evidence status check failed. Current file_status:", evidence.file_status);
            await t.rollback();
            return res.status(400).json({ error: "Only rejected evidences can be modified" });
        }

        console.log("All checks passed - proceeding with action:", action);

        if (action === "delete") {
            await evidence.destroy({ transaction: t });
            await t.commit();
            console.log("Evidence deleted successfully");
            return res.status(200).json({ message: "Evidence deleted successfully" });
        }
        else if (action === "replace") {
            if (!req.file) {
                console.log("No file uploaded for replacement");
                await t.rollback();
                return res.status(400).json({ error: "No file uploaded for replacement" });
            }

            console.log("Replacing file. Old URL:", evidence.file_url);
            evidence.file_url = req.file.path.replace(/^public/, '');
            evidence.file_status = "pending"; // back to pending for re-verification
            // evidence.rejection_reason = null;
            // evidence.reviewed_by = null;
            // evidence.reviewed_at = null;

            await evidence.save({ transaction: t });
            await t.commit();
            console.log("Evidence replaced successfully. New URL:", evidence.file_url);
            return res.status(200).json({
                message: "Evidence replaced successfully",
                evidence: evidence
            });
        }
        else {
            console.log("Invalid action:", action);
            await t.rollback();
            return res.status(400).json({ error: "Invalid action" });
        }

    } catch (error) {
        console.error("Unexpected error in modifyRejectedEvidence:", error);
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.addEvidenceToComplaint = async (req, res) => {
    uploadEvidence(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        const t = await sequelize.transaction();
        try {
            const { complaint_id } = req.params;
            const user_id = req.user?.id;

            if (!user_id) {
                await t.rollback();
                return res.status(401).json({ error: "Authentication required" });
            }

            const complaint = await DisciplinaryComplaint.findByPk(complaint_id);
            if (!complaint) {
                await t.rollback();
                return res.status(404).json({ error: "Complaint not found" });
            }

            // Check ownership
            if (complaint.applicant_id !== user_id) {
                await t.rollback();
                return res.status(403).json({ error: "Not authorized to add evidence for this complaint" });
            }

            // FIX: Update allowed statuses to include under_investigation
            const allowedStatuses = ['evidence_revision_required', 'under_review', 'under_investigation'];
            if (!allowedStatuses.includes(complaint.status)) {
                await t.rollback();
                return res.status(400).json({ error: "Cannot add evidence in current complaint status" });
            }

            if (!req.file) {
                await t.rollback();
                return res.status(400).json({ error: "No file uploaded" });
            }

            const newEvidence = await DisciplinaryComplaintEvidence.create({
                evidence_id: uuidv4(),
                disciplinary_complaint_id: complaint_id,
                file_url: req.file.path.replace(/^public/, ''),
                file_status: "pending"
            }, { transaction: t });

            await t.commit();
            res.status(201).json({
                message: "New evidence added successfully",
                evidence: newEvidence
            });

        } catch (error) {
            await t.rollback();
            console.error("Error adding evidence:", error);
            res.status(500).json({ error: error.message });
        }
    });
};

// Raise issue for disciplinary complaint
exports.raiseIssueDisciplinaryComplaint = async (req, res) => {
    const customerId = req.user?.id;
    const transaction = await sequelize.transaction();
    try {
        const disciplinary_complaint_id = req.params.disciplinary_complaint_id;
        const { issue, comment } = req.body || {};
        const rejectionComment = issue || comment;

        if (!rejectionComment || rejectionComment.trim() === "") {
            await transaction.rollback();
            return res.status(400).json({ message: "Issue/comment cannot be empty" });
        }

        const complaint = await DisciplinaryComplaint.findOne({
            where: { 
                disciplinary_complaint_id,
                applicant_id: customerId 
            },
            transaction
        });

        if (!complaint) {
            await transaction.rollback();
            return res.status(404).json({ message: "Disciplinary complaint not found or you do not have permission to access it" });
        }

        await ComplaintHasRejection.create(
            {
                disciplinary_complaint_id,
                comment: rejectionComment.trim(),
                customer_id: customerId,
            },
            { transaction }
        );

        complaint.status = "under_investigation";
        await complaint.save({ transaction });

        await transaction.commit();
        return res.status(200).json({
            message: "Issue raised successfully",
            complaint,
        });
    } catch (error) {
        console.error("Raise issue disciplinary complaint error:", error);
        await transaction.rollback();
        return res.status(500).json({
            message: "Failed to raise issue",
            error: error.message,
        });
    }
};

// Get all rejections for a disciplinary complaint
exports.getDisciplinaryComplaintRejection = async (req, res) => {
    try {
        const customerId = req.user?.id;
        const { disciplinary_complaint_id } = req.params;
        
        if (!customerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        if (!isUuid(disciplinary_complaint_id)) {
            return res.status(400).json({ message: "Invalid disciplinary complaint id format" });
        }
        
        const complaint = await DisciplinaryComplaint.findOne({
            where: { 
                disciplinary_complaint_id,
                applicant_id: customerId 
            },
            attributes: ["disciplinary_complaint_id"]
        });
        
        if (!complaint) {
            return res.status(404).json({ 
                message: "Disciplinary complaint not found or you do not have permission to access it" 
            });
        }
        
        const complaintRejections = await ComplaintHasRejection.findAll({
            where: { disciplinary_complaint_id },
            attributes: ["complaint_rejection_id", "comment", "user_id", "customer_id", "createdAt", "updatedAt"],
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["user_id", "full_name", "email"],
                    required: false,
                },
                {
                    model: CustomerAccount,
                    as: "customer",
                    attributes: ["customer_id", "full_name", "email", "phone_number"],
                    required: false,
                },
            ],
        });
        
        return res.status(200).json({
            message: "Disciplinary complaint rejections retrieved successfully",
            data: complaintRejections,
        });
    } catch (error) {
        console.error("Error fetching disciplinary complaint rejection:", error);
        return res.status(500).json({
            message: "Failed to fetch disciplinary complaint rejection",
            error: error.message,
        });
    }
};
