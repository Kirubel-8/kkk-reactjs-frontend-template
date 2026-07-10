const {
  Complaint,
  ComplaintEvidence,
  sequelize,
  CustomerAccount,
  ComplaintWitness,
  Permission,
  Role,
  User,
  Case,
  CaseAttachment,
  ComplaintHasRejection,
  CaseDecision,
  CaseDecisionLetter,
  StatusWithAgenda,
  LetterReferenceNumber,
  ComplaintEvidenceHasRejection,
  DecisionRecommendation,
  CourtOffice,
  CourtCategory,
} = require("../models");
const { Op } = require("sequelize");
const { validate: isUuid } = require("uuid");
const { v4: uuidv4 } = require("uuid");

// TODO: OBS temporarily disabled for complaints; using local disk storage
// const { uploadToOBS, getSignedUrlFromOBS } = require("../utils/obsStorage");
const logger = require("../utils/logger");

const fs = require("fs");
const path = require("path");
const upload = require("../middleware/multerConfig");
const {
  transitionFromOfficeAction,
  deriveComplaintFlags,
} = require("../utils/complaintCaseStatusHelper");

/**
 * Creates a new complaint record.
 */
exports.createComplaint = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log({
      req: JSON.stringify(req.body, null, 3),
      uploads: JSON.stringify(req.uploads, null, 2),
    });

    const nowDateOnly = new Date().toISOString().slice(0, 10);
    const complaintPayload = {
      judge_name: req.body.judge_name,
      judge_court: req.body.judge_court,
      case_file_number: req.body.case_file_number,
      case_type: req.body.case_type,
      act_date: req.body.act_date,
      detailed_description: req.body.detailed_description,
      damage_description: req.body.damage_description,
      additional_explanation: req.body.additional_explanation,
      complainant_address: req.body.complainant_address || null,
      court_office_id:
        req.body.court_office_id && req.body.court_office_id !== ""
          ? req.body.court_office_id
          : null,

      // inferred
      applicant_id: customerId,
      submission_date: nowDateOnly,

      // defaults
      get_user_id: null,
    };
    logger.info(
      "Create complaint endpoint called with payload: ",
      complaintPayload
    );

    const complaint = await Complaint.create(
      {
        ...complaintPayload,
        get_user_id: null,
      },
      { transaction }
    );

    // Normalize witnesses from multipart (stringified JSON) if provided
    let witnesses = req.body.witnesses;
    if (typeof witnesses === "string") {
      try {
        witnesses = JSON.parse(witnesses);
      } catch {
        witnesses = [];
      }
    }
    if (!Array.isArray(witnesses)) witnesses = [];

    let removeWitnessIds = req.body.remove_witness_ids;
    if (typeof removeWitnessIds === "string") {
      try {
        removeWitnessIds = JSON.parse(removeWitnessIds);
      } catch {
        removeWitnessIds = [];
      }
    }
    if (!Array.isArray(removeWitnessIds)) removeWitnessIds = [];

    let removeEvidenceIds = req.body.remove_evidence_ids;
    if (typeof removeEvidenceIds === "string") {
      try {
        removeEvidenceIds = JSON.parse(removeEvidenceIds);
      } catch {
        removeEvidenceIds = [];
      }
    }
    if (!Array.isArray(removeEvidenceIds)) removeEvidenceIds = [];

    // Upload witness signature images (if any) and create witness rows
    const signatureFiles = req.uploads?.witnessSignatures || [];
    if (witnesses.length > 0) {
      const witnessRows = await Promise.all(
        witnesses.map(async (w, i) => {
          const sigFile = signatureFiles[i];
          let signatureKey = null;
          if (sigFile) {
            // Build public path based on multer disk storage
            signatureKey = `/uploads/complaints/witness-signatures/${sigFile.filename}`;
          }
          return {
            complaint_id: complaint.complaint_id,
            witness_name: w.witness_name,
            // Backend DB still has non-null witness_address; keep a placeholder while phone is the real data
            witness_address: w.witness_address || w.witness_phone_number || "",
            witness_phone_number: w.witness_phone_number || null,
            witness_signature: signatureKey,
          };
        })
      );
      if (witnessRows.length > 0) {
        await ComplaintWitness.bulkCreate(witnessRows, { transaction });
      }
    }

    // Upload generic evidence files (any type)
    const evidenceFiles = req.uploads?.evidenceFiles || [];
    if (evidenceFiles.length > 0) {
      logger.info(
        `Saving ${evidenceFiles.length} evidence attachments to local storage`
      );
      const evidenceRows = await Promise.all(
        evidenceFiles.map(async (file) => {
          return {
            complaint_id: complaint.complaint_id,
            file_type: file.mimetype,
            file_path: `/uploads/complaints/evidence/${file.filename}`,
            uploaded_by: req.user.id || null,
            uploaded_at: new Date(),
          };
        })
      );
      await ComplaintEvidence.bulkCreate(evidenceRows, { transaction });
    }

    await transaction.commit();
    return res.status(201).json({
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error) {
    logger.error("Error creating new complaint", error);
    await transaction.rollback();
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Retrieves complaints or a single complaint when an id is provided.
 */
exports.getComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, judge_name } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (judge_name)
      whereClause.judge_name = {
        [Op.like]: `%${judge_name}%`,
      };

    console.log("get complaint conditions: ", {
      whereClause,
      offset,
      limit,
      status,
      judge_name,
    });

    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (id) {
      // Validate UUID to avoid DB casting errors
      if (!isUuid(id)) {
        return res.status(400).json({ message: "Invalid complaint id format" });
      }
      const complaint = await Complaint.findOne({
        where: { complaint_id: id, applicant_id: customerId, ...whereClause },
        include: [
          {
            model: ComplaintEvidence,
            as: "evidences",
            attributes: [
              "complaint_evidence_id",
              "file_path",
              "file_type",
              "status",
              "rejection_reason",
              "uploaded_at",
              "uploaded_by",
            ],
          },
          {
            model: ComplaintWitness,
            as: "witnesses",
            attributes: [
              "complaint_witness_id",
              "witness_name",
              "witness_address",
              "witness_phone_number",
              "witness_signature",
            ],
          },
          {
            model: CustomerAccount,
            as: "applicant",
            attributes: ["full_name", "email", "phone_number"],
          },
          {
            model: ComplaintHasRejection,
            as: "complaintRejection",
            attributes: ["complaint_rejection_id", "comment", "createdAt"],
          },
          {
            model: CourtOffice,
            as: "courtOffice",
            attributes: ["court_office_id", "name"],
            required: false,
            include: [
              {
                model: CourtCategory,
                as: "category",
                attributes: ["court_category_id", "name"],
                required: false,
              },
            ],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      const complaintJson = complaint.toJSON();
      if (Array.isArray(complaintJson.evidences)) {
        complaintJson.evidences = complaintJson.evidences.map((e) => ({
          ...e,
          public_url: e.file_path || null,
        }));
      }

      // witness signitures
      if (Array.isArray(complaintJson.witnesses)) {
        complaintJson.witnesses = complaintJson.witnesses.map((w) => ({
          ...w,
          public_url: w.witness_signature || null,
        }));
      }

      return res.status(200).json({
        data: complaintJson,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalCount: 1,
          hasNext: false,
          hasPrev: page > 1,
        },
      });
    }

    const { count, rows: complaints } = await Complaint.findAndCountAll({
      where: { applicant_id: customerId, ...whereClause },
      distinct: true,
      include: [
        {
          model: ComplaintEvidence,
          as: "evidences",
          attributes: [
            "complaint_evidence_id",
            "file_path",
            "file_type",
            "status",
            "rejection_reason",
            "uploaded_at",
            "uploaded_by",
          ],
        },
        {
          model: ComplaintWitness,
          as: "witnesses",
          attributes: [
            "complaint_witness_id",
            "witness_name",
            "witness_address",
            "witness_phone_number",
            "witness_signature",
          ],
        },
        {
          model: CustomerAccount,
          as: "applicant",
          attributes: ["full_name", "email", "phone_number"],
        },
        {
          model: ComplaintHasRejection,
          as: "complaintRejection",
          attributes: ["complaint_rejection_id", "comment", "createdAt"],
        },
        {
          model: CourtOffice,
          as: "courtOffice",
          attributes: ["court_office_id", "name"],
          required: false,
          include: [
            {
              model: CourtCategory,
              as: "category",
              attributes: ["court_category_id", "name"],
              required: false,
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });
    console.log("complaints: ", { complaints, count });

    const complaintsWithUrls = complaints.map((complaint) => {
      const complaintJson = complaint.toJSON();
      if (Array.isArray(complaintJson.evidences)) {
        complaintJson.evidences = complaintJson.evidences.map((evidence) => ({
          ...evidence,
          public_url: evidence.file_path || null,
        }));
      }
      if (Array.isArray(complaintJson.witnesses)) {
        complaintJson.witnesses = complaintJson.witnesses.map((w) => ({
          ...w,
          public_url: w.witness_signature || null,
        }));
      }
      return complaintJson;
    });

    return res.status(200).json({
      data: complaintsWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalCount: count,
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error retrieving complaints", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Updates a complaint by id.
 */
exports.updateComplaint = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const customerId = req.user?.id;
    if (!customerId) {
      await transaction.rollback();
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isUuid(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid complaint id format" });
    }

    const complaint = await Complaint.findOne({
      where: { complaint_id: id, applicant_id: customerId },
      transaction,
    });

    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Normalize all array inputs before any usage
    let witnesses = req.body.witnesses;
    if (typeof witnesses === "string") {
      try {
        witnesses = JSON.parse(witnesses);
      } catch {
        witnesses = [];
      }
    }
    if (!Array.isArray(witnesses)) witnesses = [];

    let removeWitnessIds = req.body.remove_witness_ids;
    if (typeof removeWitnessIds === "string") {
      try {
        removeWitnessIds = JSON.parse(removeWitnessIds);
      } catch {
        removeWitnessIds = [];
      }
    }
    if (!Array.isArray(removeWitnessIds)) removeWitnessIds = [];

    let removeEvidenceIds = req.body.remove_evidence_ids;
    if (typeof removeEvidenceIds === "string") {
      try {
        removeEvidenceIds = JSON.parse(removeEvidenceIds);
      } catch {
        removeEvidenceIds = [];
      }
    }
    if (!Array.isArray(removeEvidenceIds)) removeEvidenceIds = [];

    const updatableFields = [
      "judge_name",
      "judge_court",
      "case_file_number",
      "case_type",
      "act_date",
      "detailed_description",
      "damage_description",
      "additional_explanation",
      "complainant_address",
      "court_office_id",
    ];
    const complaintPayload = {};
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        // Handle court_office_id: empty string should be null
        if (field === "court_office_id" && req.body[field] === "") {
          complaintPayload[field] = null;
        } else {
          complaintPayload[field] = req.body[field];
        }
      }
    }

    // If status is "returned", move back to "under_investigation" when updating,
    // using centralized transition rules (return reason is preserved separately).
    if (complaint.status === "returned") {
      const { complaintStatus } = transitionFromOfficeAction({
        currentComplaintStatus: complaint.status,
        action: "customer_update_returned",
      });
      complaintPayload.status = complaintStatus;
    }

    await complaint.update(complaintPayload, { transaction });

    // Update witnesses only when supplied (body field, files, or removals)
    const signatureFiles = req.uploads?.witnessSignatures || [];
    const hasWitnessesField = Object.prototype.hasOwnProperty.call(
      req.body,
      "witnesses"
    );
    if (
      hasWitnessesField ||
      signatureFiles.length > 0 ||
      removeWitnessIds.length > 0
    ) {
      // Upsert/update provided witnesses
      if (witnesses.length > 0) {
        for (let i = 0; i < witnesses.length; i++) {
          const w = witnesses[i] || {};
          const sigFile = signatureFiles[i];
          const newSignatureKey = sigFile
            ? `/uploads/complaints/witness-signatures/${sigFile.filename}`
            : null;

          if (w.complaint_witness_id) {
            // Update existing witness
            const existing = await ComplaintWitness.findOne({
              where: {
                complaint_witness_id: w.complaint_witness_id,
                complaint_id: complaint.complaint_id,
              },
              transaction,
            });
            if (existing) {
              // If replacing signature, delete old file if exists
              if (newSignatureKey) {
                const oldPath = existing.witness_signature;
                if (oldPath) {
                  const abs = path.join(
                    __dirname,
                    "..",
                    "public",
                    (oldPath || "").replace(/^\//, "")
                  );
                  if (fs.existsSync(abs)) {
                    try {
                      fs.unlinkSync(abs);
                    } catch (_) {}
                  }
                }
              }
              const updateData = {};
              if (w.witness_name !== undefined)
                updateData.witness_name = w.witness_name;
              if (w.witness_phone_number !== undefined)
                updateData.witness_phone_number = w.witness_phone_number;
              if (newSignatureKey)
                updateData.witness_signature = newSignatureKey;
              await existing.update(updateData, { transaction });
            }
          } else {
            // Create new witness
            await ComplaintWitness.create(
              {
                complaint_id: complaint.complaint_id,
                witness_name: w.witness_name,
                // Keep address column non-null by mirroring phone or using empty string
                witness_address:
                  w.witness_address || w.witness_phone_number || "",
                witness_phone_number: w.witness_phone_number || null,
                witness_signature: newSignatureKey,
              },
              { transaction }
            );
          }
        }
      }

      // Remove selected witnesses
      if (removeWitnessIds.length > 0) {
        const toRemove = await ComplaintWitness.findAll({
          where: {
            complaint_id: complaint.complaint_id,
            complaint_witness_id: removeWitnessIds,
          },
          transaction,
        });
        for (const cw of toRemove) {
          if (cw.witness_signature) {
            const abs = path.join(
              __dirname,
              "..",
              "public",
              (cw.witness_signature || "").replace(/^\//, "")
            );
            if (fs.existsSync(abs)) {
              try {
                fs.unlinkSync(abs);
              } catch (_) {}
            }
          }
        }
        await ComplaintWitness.destroy({
          where: {
            complaint_id: complaint.complaint_id,
            complaint_witness_id: removeWitnessIds,
          },
          transaction,
        });
      }
    }

    // Evidence removals
    if (removeEvidenceIds.length > 0) {
      const evidencesToRemove = await ComplaintEvidence.findAll({
        where: {
          complaint_id: complaint.complaint_id,
          complaint_evidence_id: removeEvidenceIds,
        },
        transaction,
      });
      for (const ev of evidencesToRemove) {
        if (ev.file_path) {
          const abs = path.join(
            __dirname,
            "..",
            "public",
            (ev.file_path || "").replace(/^\//, "")
          );
          if (fs.existsSync(abs)) {
            try {
              fs.unlinkSync(abs);
            } catch (_) {}
          }
        }
      }
      await ComplaintEvidence.destroy({
        where: {
          complaint_id: complaint.complaint_id,
          complaint_evidence_id: removeEvidenceIds,
        },
        transaction,
      });
    }

    // Evidence additions (new files only)
    const evidenceFiles = req.uploads?.evidenceFiles || [];
    if (evidenceFiles.length > 0) {
      const evidenceRows = await Promise.all(
        evidenceFiles.map(async (file) => {
          return {
            complaint_id: complaint.complaint_id,
            file_type: file.mimetype,
            file_path: `/uploads/complaints/evidence/${file.filename}`,
            uploaded_by: req.user.id || null,
            uploaded_at: new Date(),
          };
        })
      );
      await ComplaintEvidence.bulkCreate(evidenceRows, { transaction });
    }

    await transaction.commit();
    return res.status(200).json({
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error updating complaint", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, get_user_id } = req.body;
    const { id } = req.params;
    const validStatuses = [
      "pending",
      "rejected",
      "under_investigation",
      "accepted",
      "under_council_review",
      "Decided",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    await complaint.update({
      status,
      get_user_id,
    });

    res.status(200).json({
      message: "complaint status updated successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Error updating complaint status", error);
    res.status(500).json({ error: error.message });
  }
};
/**
 * Deletes a complaint by id.
 */
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const complaint = await Complaint.findOne({
      where: { complaint_id: id, applicant_id: customerId },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await complaint.destroy();

    return res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (error) {
    logger.error("Error deleting complaint", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getCompliantRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    console.log("expertId");

    const expertId = req.user.id;
    if (!expertId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const userPermissions = await User.findOne({
      where: { user_id: expertId },
      include: [
        {
          model: Role,
          as: "roles",
          include: [
            {
              model: Permission,
              as: "permissions",
              attributes: ["action", "resource"],
            },
          ],
        },
      ],
    });

    if (!userPermissions) {
      return res
        .status(403)
        .json({ error: "User not found or has no permissions" });
    }
    const hasPermission = userPermissions.roles.some((role) =>
      role.permissions.some(
        (perm) => perm.action === "can_get" && perm.resource === "complaint"
      )
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ error: "You do not have permission to perform this action" });
    }
    const unassignedComplaintRequest = await Complaint.findOne({
      where: {
        status: "pending",
        get_user_id: null,
      },
      include: [
        {
          model: CourtOffice,
          as: "courtOffice",
          attributes: ["court_office_id", "name"],
          required: false,
          include: [
            {
              model: CourtCategory,
              as: "category",
              attributes: ["court_category_id", "name"],
              required: false,
            },
          ],
        },
      ],
    });
    if (!unassignedComplaintRequest) {
      return res.status(404).json({ error: "Complaint not found." });
    }
    const { complaintStatus } = transitionFromOfficeAction({
      currentComplaintStatus: unassignedComplaintRequest.status,
      action: "get",
    });

    await unassignedComplaintRequest.update({
      status: complaintStatus,
      get_user_id: expertId || null,
    });
    res.status(200).json({
      message: "Complaint status updated successfully",
      unassignedComplaintRequest,
      success: true,
    });
  } catch (error) {
    await t.rollback();
    console.error(" Error in getCompliantRequest:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getAllRequestCompliantRequest = async (req, res) => {
  try {
    console.log("req.user", req.user);
    const expertId = req.user?.id;
    if (!expertId) return res.status(401).json({ message: "Unauthorized" });

    const { status, page = 1, limit = 10 } = req.query;

    const allowedStatuses = [
      "all",
      "under_investigation",
      "accepted",
      "pending",
      "rejected",
      "under_council_review",
      "decided",
      "returned",
    ];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    // Build where clause and include options based on status
    let whereClause = { get_user_id: expertId };
    let includeOptions = [
      { model: ComplaintEvidence, as: "evidences" },
      { model: ComplaintWitness, as: "witnesses" },
      { model: CustomerAccount, as: "applicant" },
      {
        model: CourtOffice,
        as: "courtOffice",
        attributes: ["court_office_id", "name"],
        required: false,
        include: [
          {
            model: CourtCategory,
            as: "category",
            attributes: ["court_category_id", "name"],
            required: false,
          },
        ],
      },
      {
        model: Case,
        as: "case",
        required: false,
        include: [
          {
            model: CaseDecision,
            as: "decision",
            required: false,
            include: [
              {
                model: StatusWithAgenda,
                as: "status",
                attributes: ["status_id", "name", "decision_type"],
              },
              {
                model: LetterReferenceNumber,
                as: "letterRef",
                attributes: ["reference_id", "reference_number"],
              },
              {
                model: CaseDecisionLetter,
                as: "letters",
                attributes: [
                  "decision_letter_id",
                  "letter_type",
                  "letter_content",
                  "status",
                  "created_at",
                ],
              },
            ],
          },
        ],
      },
    ];

    if (status === "all") {
      // Show any assigned complaints regardless of status
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    } else if (status === "rejected") {
      // For rejected tab: show complaints with status "rejected"
      whereClause.status = "rejected";
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    } else if (status === "under_investigation") {
      // For under investigation tab: show complaints with status "under_investigation" that are not rejected or returned
      whereClause = {
        ...whereClause,
        status: "under_investigation",
        [Op.not]: [{ status: "rejected" }, { status: "returned" }],
      };
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    } else if (status === "returned") {
      // Show complaints with status "returned"
      whereClause.status = "returned";
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    } else if (status === "under_council_review") {
      // Show complaints that have moved to council review
      whereClause.status = "under_council_review";
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    } else if (status === "decided") {
      // Complaints that have been decided (finalized)
      whereClause.status = "Decided";
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    } else {
      // For other statuses, use the status directly
      whereClause.status = status;
      includeOptions.push({
        model: ComplaintHasRejection,
        as: "complaintRejection",
        required: false,
        attributes: ["complaint_rejection_id", "comment", "createdAt"],
      });
    }

    const { count, rows: complaints } = await Complaint.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      distinct: true, // Important when using includes with filters
      limit: limitNumber,
      offset,
      order: [["created_at", "DESC"]],
    });

    const complaintsWithUrls = complaints.map((c) => {
      const complaintJson = c.toJSON();
      complaintJson.evidences = (complaintJson.evidences || []).map((e) => ({
        ...e,
        public_url: e.file_path || null,
      }));
      complaintJson.witnesses = (complaintJson.witnesses || []).map((w) => ({
        ...w,
        public_url: w.witness_signature || null,
      }));

      // Add small derived flags for frontend clarity (stage-aware rendering)
      const flags = deriveComplaintFlags(complaintJson);

      return {
        ...complaintJson,
        ...flags,
      };
    });

    return res.status(200).json({
      data: complaintsWithUrls,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(count / limitNumber),
        totalCount: count,
        hasNext: pageNumber * limitNumber < count,
        hasPrev: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("Error retrieving expert complaints:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint_id = req.params.compliant_id;

    const complaint = await Complaint.findOne({
      where: { complaint_id },
      include: [
        {
          model: ComplaintEvidence,
          as: "evidences",
        },
        {
          model: ComplaintWitness,
          as: "witnesses",
        },
        {
          model: CustomerAccount,
          as: "applicant",
        },
        {
          model: ComplaintHasRejection,
          as: "complaintRejection",
        },
        {
          model: CourtOffice,
          as: "courtOffice",
          attributes: ["court_office_id", "name"],
          required: false,
          include: [
            {
              model: CourtCategory,
              as: "category",
              attributes: ["court_category_id", "name"],
              required: false,
            },
          ],
        },
        {
          model: Case,
          as: "case",
          required: false,
          include: [
            {
              model: CaseAttachment,
              as: "attachments",
              required: false,
            },
            {
              model: CaseDecision,
              as: "decision",
              required: false,
              include: [
                {
                  model: StatusWithAgenda,
                  as: "status",
                  attributes: ["status_id", "name", "decision_type"],
                },
                {
                  model: LetterReferenceNumber,
                  as: "letterRef",
                  attributes: ["reference_id", "reference_number"],
                },
                {
                  model: CaseDecisionLetter,
                  as: "letters",
                  attributes: [
                    "decision_letter_id",
                    "letter_type",
                    "letter_content",
                    "status",
                    "created_at",
                  ],
                  where: req.query.letter_type
                    ? { letter_type: "complainant_letter" }
                    : undefined,
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.status(200).json({ complaint });
  } catch (error) {
    console.error("Error retrieving complaint by ID:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.approveEvidence = async (req, res) => {
  try {
    const complaint_evidence_id = req.params.complaint_evidence_id;

    const evidence = await ComplaintEvidence.findOne({
      where: { complaint_evidence_id },
    });

    if (!evidence) {
      return res.status(404).json({ message: "Evidence not found" });
    }

    evidence.status = "approved";
    await evidence.save();

    return res.status(200).json({
      message: "Evidence approved successfully",
      evidence,
    });
  } catch (error) {
    console.error("Error approving complaint evidence:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.approveComplaint = async (req, res) => {
  try {
    const compliant_id = req.params.compliant_id;

    const complaint = await Complaint.findOne({
      where: { complaint_id: compliant_id },
      include: [
        {
          model: Case,
          as: "case",
          required: true,
        },
      ],
    });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Evidences are optional to add, but not approving the ones that are there is still blocked
    const evidences = await ComplaintEvidence.findAll({
      where: { complaint_id: compliant_id },
    });
    if (evidences && evidences.length > 0) {
      const unapproved = evidences.filter(
        (evidence) => evidence.status !== "approved"
      );

      if (unapproved.length > 0) {
        return res.status(400).json({
          message: "Cannot approve complaint — not all evidences are approved",
          unapprovedEvidenceCount: unapproved.length,
        });
      }
    }

    console.log("Current case status: ", {
      currentComplaintStatus: complaint.status,
      currentCaseStatus: complaint?.case?.status || null,
    });

    const { complaintStatus, caseStatus } = transitionFromOfficeAction({
      currentComplaintStatus: complaint.status,
      currentCaseStatus: complaint.case?.status || null,
      action: "accept",
    });

    console.log("Approving the complaint from the council office", {
      complaintStatus,
      caseStatus,
    });

    complaint.status = complaintStatus;
    complaint.case.status = caseStatus;

    await complaint.save();
    await complaint.case.save();

    return res.status(200).json({
      message: "Complaint accepted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Error accepting complaint:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Creates a new decision recommendation for the authenticated officer.
 */
exports.createDecisionRecommendation = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status_with_agenda_id, description, complaint_id } = req.body || {};

    if (!complaint_id) {
      return res.status(400).json({
        message: "complaint_id is required to recommend a decision",
      });
    }

    const complaint = await Complaint.findByPk(complaint_id, {
      include: [
        {
          model: Case,
          as: "case",
          required: true,
        },
      ],
    });
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!complaint.case) {
      return res.status(400).json({
        message: "Complaint does not have an associated case",
      });
    }

    if (complaint.status !== "under_investigation") {
      return res.status(400).json({
        message:
          "Decision recommendation can only be created while complaint is under investigation",
      });
    }

    if (!status_with_agenda_id || !isUuid(status_with_agenda_id)) {
      return res.status(400).json({
        message: "Valid status_with_agenda_id is required",
      });
    }

    const status = await StatusWithAgenda.findByPk(status_with_agenda_id);
    if (!status) {
      return res.status(404).json({
        message: "StatusWithAgenda not found",
      });
    }

    const recommendation = await DecisionRecommendation.create({
      user_id: userId,
      case_id: complaint.case.case_id,
      status_with_agenda_id,
      description: description || null,
    });

    return res.status(201).json({
      message: "Decision recommendation created successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("Error creating decision recommendation:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Retrieves decision recommendations for the authenticated officer.
 * If id is provided, returns a single recommendation; otherwise returns a list.
 */
exports.getDecisionRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { complaint_id } = req.query;

    if (id) {
      if (!isUuid(id)) {
        return res.status(400).json({
          message: "Invalid decision_recommendation_id format",
        });
      }

      const recommendation = await DecisionRecommendation.findOne({
        where: {
          decision_recommendation_id: id,
          user_id: userId,
        },
      });

      if (!recommendation) {
        return res.status(404).json({
          message: "Decision recommendation not found",
        });
      }

      return res.status(200).json({ data: recommendation });
    }

    // If complaint_id is provided, filter by case_id from that complaint
    let whereClause = { user_id: userId };
    if (complaint_id) {
      if (!isUuid(complaint_id)) {
        return res.status(400).json({
          message: "Invalid complaint_id format",
        });
      }

      const complaint = await Complaint.findByPk(complaint_id, {
        include: [
          {
            model: Case,
            as: "case",
            required: true,
          },
        ],
      });

      if (!complaint || !complaint.case) {
        return res.status(404).json({
          message: "Complaint not found or does not have an associated case",
        });
      }

      whereClause.case_id = complaint.case.case_id;
    }

    const recommendations = await DecisionRecommendation.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ data: recommendations });
  } catch (error) {
    console.error("Error retrieving decision recommendations:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Updates a decision recommendation owned by the authenticated officer.
 */
exports.updateDecisionRecommendation = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status_with_agenda_id, description, complaint_id } = req.body || {};

    if (!isUuid(id)) {
      return res.status(400).json({
        message: "Invalid decision_recommendation_id format",
      });
    }

    const recommendation = await DecisionRecommendation.findOne({
      where: {
        decision_recommendation_id: id,
        user_id: userId,
      },
    });

    if (!recommendation) {
      return res.status(404).json({
        message: "Decision recommendation not found",
      });
    }

    if (!complaint_id) {
      return res.status(400).json({
        message: "complaint_id is required to update a decision recommendation",
      });
    }

    const complaint = await Complaint.findByPk(complaint_id, {
      include: [
        {
          model: Case,
          as: "case",
          required: true,
        },
      ],
    });
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!complaint.case) {
      return res.status(400).json({
        message: "Complaint does not have an associated case",
      });
    }

    if (complaint.status !== "under_investigation") {
      return res.status(400).json({
        message:
          "Decision recommendation can only be updated while complaint is under investigation",
      });
    }

    // Verify the recommendation belongs to the same case
    if (recommendation.case_id !== complaint.case.case_id) {
      return res.status(400).json({
        message: "Decision recommendation does not belong to this case",
      });
    }

    const updatePayload = {};

    if (status_with_agenda_id !== undefined) {
      if (!status_with_agenda_id || !isUuid(status_with_agenda_id)) {
        return res.status(400).json({
          message: "Valid status_with_agenda_id is required when updating",
        });
      }

      const status = await StatusWithAgenda.findByPk(status_with_agenda_id);
      if (!status) {
        return res.status(404).json({
          message: "StatusWithAgenda not found",
        });
      }

      updatePayload.status_with_agenda_id = status_with_agenda_id;
    }

    if (description !== undefined) {
      updatePayload.description = description || null;
    }

    await recommendation.update(updatePayload);

    return res.status(200).json({
      message: "Decision recommendation updated successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("Error updating decision recommendation:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Deletes a decision recommendation owned by the authenticated officer.
 */
exports.deleteDecisionRecommendation = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { complaint_id } = req.body || {};

    if (!isUuid(id)) {
      return res.status(400).json({
        message: "Invalid decision_recommendation_id format",
      });
    }

    const recommendation = await DecisionRecommendation.findOne({
      where: {
        decision_recommendation_id: id,
        user_id: userId,
      },
    });

    if (!recommendation) {
      return res.status(404).json({
        message: "Decision recommendation not found",
      });
    }

    if (!complaint_id) {
      return res.status(400).json({
        message: "complaint_id is required to delete a decision recommendation",
      });
    }

    const complaint = await Complaint.findByPk(complaint_id, {
      include: [
        {
          model: Case,
          as: "case",
          required: true,
        },
      ],
    });
    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (!complaint.case) {
      return res.status(400).json({
        message: "Complaint does not have an associated case",
      });
    }

    if (complaint.status !== "under_investigation") {
      return res.status(400).json({
        message:
          "Decision recommendation can only be deleted while complaint is under investigation",
      });
    }

    // Verify the recommendation belongs to the same case
    if (recommendation.case_id !== complaint.case.case_id) {
      return res.status(400).json({
        message: "Decision recommendation does not belong to this case",
      });
    }

    // Ensure user has at least one complaint under investigation
    const activeComplaint = await Complaint.findOne({
      where: {
        get_user_id: userId,
        status: "under_investigation",
      },
    });
    if (!activeComplaint) {
      return res.status(400).json({
        message:
          "Cannot delete decision recommendation once the complaint is no longer under investigation.",
      });
    }

    await recommendation.destroy();

    return res.status(200).json({
      message: "Decision recommendation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting decision recommendation:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.rejectComplaint = async (req, res) => {
  const userId = req.user?.id;
  const transaction = await sequelize.transaction();
  try {
    const complaint_id = req.params.compliant_id;
    const { comment } = req.body || {};

    const complaint = await Complaint.findByPk(complaint_id, { transaction });
    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Persist rejection feedback
    await ComplaintHasRejection.create(
      {
        complaint_id,
        comment: comment || null,
        user_id: userId,
      },
      { transaction }
    );

    // Update complaint status using helper
    const { complaintStatus } = transitionFromOfficeAction({
      currentComplaintStatus: complaint.status,
      action: "reject",
    });
    complaint.status = complaintStatus;
    await complaint.save({ transaction });

    await transaction.commit();
    return res.status(200).json({
      message: "Complaint rejected successfully",
      complaint,
    });
  } catch (error) {
    console.error("Reject complaint error:", error);
    await transaction.rollback();
    return res.status(500).json({
      message: "Failed to reject complaint",
      error: error.message,
    });
  }
};

exports.returnComplaint = async (req, res) => {
  const userId = req.user?.id;
  const transaction = await sequelize.transaction();
  try {
    const complaint_id = req.params.compliant_id;
    const { comment } = req.body || {};

    const complaint = await Complaint.findByPk(complaint_id, { transaction });
    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Persist return feedback (using ComplaintHasRejection table)
    await ComplaintHasRejection.create(
      {
        complaint_id,
        comment: comment || null,
        user_id: userId,
      },
      { transaction }
    );

    // Update complaint status using helper
    const { complaintStatus } = transitionFromOfficeAction({
      currentComplaintStatus: complaint.status,
      action: "return",
    });

    complaint.status = complaintStatus;
    await complaint.save({ transaction });

    await transaction.commit();
    return res.status(200).json({
      message: "Complaint returned successfully",
      complaint,
    });
  } catch (error) {
    console.error("Return complaint error:", error);
    await transaction.rollback();
    return res.status(500).json({
      message: "Failed to return complaint",
      error: error.message,
    });
  }
};

exports.raiseIssueComplaint = async (req, res) => {
  const userId = req.user?.id;
  const transaction = await sequelize.transaction();
  try {
    const complaint_id = req.params.compliant_id;
    const { comment, issue } = req.body || {};

    // Accept both 'issue' and 'comment' for backward compatibility
    const commentText = issue || comment;

    if (!commentText || !commentText.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: "Issue/comment is required" });
    }

    const complaint = await Complaint.findByPk(complaint_id, { transaction });
    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Persist return feedback (using ComplaintHasRejection table)
    await ComplaintHasRejection.create(
      {
        complaint_id,
        comment: commentText.trim(),
        customer_id: userId,
      },
      { transaction }
    );

    complaint.status = "under_investigation";
    await complaint.save({ transaction });

    await transaction.commit();
    return res.status(200).json({
      message: "Complaint raised successfully",
      complaint,
    });
  } catch (error) {
    console.error("Raise issue complaint error:", error);
    await transaction.rollback();
    return res.status(500).json({
      message: "Failed to raise issue complaint",
      error: error.message,
    });
  }
};

exports.rejectEvidence = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { complaint_evidence_id } = req.params;
    const { comment } = req.body || {};

    const evidence = await ComplaintEvidence.findOne({
      where: { complaint_evidence_id },
      transaction,
    });
    if (!evidence) {
      await transaction.rollback();
      return res.status(404).json({ message: "Evidence not found" });
    }

    // Update evidence status and store reason inline for applicant visibility
    evidence.status = "rejected";
    evidence.rejection_reason = comment || evidence.rejection_reason || null;
    await evidence.save({ transaction });

    // Optionally also log rejection entry
    const complaint_rejection_id = uuidv4();
    await ComplaintEvidenceHasRejection.create(
      {
        complaint_rejection_id,
        complaint_evidence_id,
        comment: comment || null,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      message: "Evidence rejected successfully",
      evidence,
    });
  } catch (error) {
    console.error("Reject evidence error:", error);
    await transaction.rollback();
    return res.status(500).json({
      message: "Failed to reject evidence",
      error: error.message,
    });
  }
};

exports.uploadInvestigation = async (req, res) => {
  const transaction = await Case.sequelize.transaction();
  try {
    const { complaint_id, note } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];
    const trimmedNote = typeof note === "string" ? note.trim() : "";
    if (!complaint_id) {
      return res.status(400).json({ message: "Missing complaint_id" });
    }
    const complaint = await Complaint.findOne({
      where: { complaint_id: complaint_id },
      transaction,
    });

    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Investigation attachments can only be uploaded while complaint is under investigation
    if (complaint.status !== "under_investigation") {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Investigation files can only be uploaded while the complaint is under investigation.",
      });
    }

    if (files.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Please upload at least one file.",
      });
    }

    // Reuse existing case if present; otherwise create a new one
    let existingCase = await Case.findOne({
      where: { complaint_id },
      transaction,
    });
    if (!existingCase) {
      console.log(
        "[UploadInvestigation] No existing case found, creating new one"
      );
      existingCase = await Case.create(
        {
          case_id: uuidv4(),
          complaint_id: complaint_id,
          case_number: `CASE-${Math.floor(100000 + Math.random() * 900000)}`,
          case_type: null,
          status: "open",
          created_by: req.user?.id || "system",
        },
        { transaction }
      );
    } else {
      console.log(
        "[UploadInvestigation] Found existing case: ",
        existingCase.case_id
      );
    }
    const attachments = await CaseAttachment.bulkCreate(
      files.map((f) => ({
        case_attachment_id: uuidv4(),
        case_id: existingCase.case_id,
        file_name: f.originalname,
        file_path: `/uploads/investigations/files/${f.filename}`,
        description: trimmedNote.length > 0 ? trimmedNote : null,
        uploaded_by: req.user?.id || null,
      })),
      {
        transaction,
        returning: true,
      }
    );

    await transaction.commit();

    res.status(200).json({
      message:
        trimmedNote.length > 0
          ? "Investigation note and file uploaded successfully"
          : "Attachments uploaded successfully",
      case: existingCase,
      attachments,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error uploading investigation:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.updateCaseAttachment = async (req, res) => {
  const transaction = await Case.sequelize.transaction();
  try {
    const { case_attachment_id } = req.params;
    const { description } = req.body || {};
    const files = Array.isArray(req.files) ? req.files : [];
    const newFile = files[0] || null;

    // First, fetch attachment to get case_id
    const attachment = await CaseAttachment.findByPk(case_attachment_id, {
      transaction,
    });

    if (!attachment) {
      await transaction.rollback();
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Fetch the case and complaint to check status
    const caseRecord = await Case.findByPk(attachment.case_id, {
      include: [
        {
          model: Complaint,
          as: "complaint",
          attributes: ["status"],
        },
      ],
      transaction,
    });

    if (!caseRecord || !caseRecord.complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Case or complaint not found" });
    }

    const complaintStatus = caseRecord.complaint.status;
    if (complaintStatus !== "under_investigation") {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Investigation attachments can only be modified while the complaint is under investigation.",
      });
    }

    const previousPath = attachment.file_path;

    // Update file if provided
    if (newFile) {
      attachment.file_name = newFile.originalname;
      attachment.file_path = `/uploads/investigations/files/${newFile.filename}`;
    }

    // Update description if provided
    if (description !== undefined) {
      attachment.description =
        description && description.trim() ? description.trim() : null;
    }

    console.log("Updated attachment:", { attachment });
    await attachment.save({ transaction });
    console.log("Saved attachment:", { attachment });
    await transaction.commit();
    console.log("Transaction committed");

    // Only delete old file if a new file was uploaded
    if (newFile && previousPath) {
      const relativePrevPath = previousPath.startsWith("/")
        ? previousPath.slice(1)
        : previousPath;
      const absolutePrevPath = path.join(
        __dirname,
        "..",
        "public",
        relativePrevPath
      );
      if (fs.existsSync(absolutePrevPath)) {
        fs.unlink(absolutePrevPath, () => {});
      }
    }

    return res.status(200).json({
      message: "Attachment updated successfully",
      attachment,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating case attachment:", error);
    return res.status(500).json({
      message: "Failed to update attachment",
      error: error.message,
    });
  }
};

exports.deleteCaseAttachment = async (req, res) => {
  const transaction = await Case.sequelize.transaction();
  try {
    const { case_attachment_id } = req.params;

    // First, fetch attachment to get case_id
    const attachment = await CaseAttachment.findByPk(case_attachment_id, {
      transaction,
    });

    if (!attachment) {
      await transaction.rollback();
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Fetch the case and complaint to check status
    const caseRecord = await Case.findByPk(attachment.case_id, {
      include: [
        {
          model: Complaint,
          as: "complaint",
          attributes: ["status"],
        },
      ],
      transaction,
    });

    if (!caseRecord || !caseRecord.complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Case or complaint not found" });
    }

    const complaintStatus = caseRecord.complaint.status;
    if (complaintStatus !== "under_investigation") {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Investigation attachments can only be deleted while the complaint is under investigation.",
      });
    }

    const previousPath = attachment.file_path;
    await attachment.destroy({ transaction });
    await transaction.commit();

    if (previousPath) {
      const relativePrevPath = previousPath.startsWith("/")
        ? previousPath.slice(1)
        : previousPath;
      const absolutePrevPath = path.join(
        __dirname,
        "..",
        "public",
        relativePrevPath
      );
      if (fs.existsSync(absolutePrevPath)) {
        fs.unlink(absolutePrevPath, () => {});
      }
    }

    return res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting case attachment:", error);
    return res.status(500).json({
      message: "Failed to delete attachment",
      error: error.message,
    });
  }
};

exports.bulkUpdateAttachments = async (req, res) => {
  const transaction = await Case.sequelize.transaction();
  try {
    const { complaint_id } = req.body;
    const deletesJson = req.body.deletes;
    const replacesJson = req.body.replaces;

    if (!complaint_id) {
      await transaction.rollback();
      return res.status(400).json({ message: "Missing complaint_id" });
    }

    // Parse JSON arrays
    let deleteIds = [];
    let replaceIds = [];

    if (deletesJson) {
      try {
        deleteIds = JSON.parse(deletesJson);
      } catch (e) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid deletes format" });
      }
    }

    if (replacesJson) {
      try {
        replaceIds = JSON.parse(replacesJson);
      } catch (e) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid replaces format" });
      }
    }

    // Validate complaint status
    const complaint = await Complaint.findByPk(complaint_id, {
      transaction,
    });

    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status !== "under_investigation") {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "Investigation attachments can only be modified while the complaint is under investigation.",
      });
    }

    // Get the case
    const caseRecord = await Case.findOne({
      where: { complaint_id },
      transaction,
    });

    if (!caseRecord) {
      await transaction.rollback();
      return res.status(404).json({ message: "Case not found" });
    }

    // Collect all attachment IDs to validate
    const allAttachmentIds = [...new Set([...deleteIds, ...replaceIds])];

    if (allAttachmentIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "No changes specified" });
    }

    // Validate all attachments exist and belong to the case
    const attachments = await CaseAttachment.findAll({
      where: {
        case_attachment_id: { [Op.in]: allAttachmentIds },
        case_id: caseRecord.case_id,
      },
      transaction,
    });

    if (attachments.length !== allAttachmentIds.length) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Some attachments not found or do not belong to this case",
      });
    }

    const filesToDelete = [];
    const filesToReplace = [];

    // Process deletes
    for (const attachmentId of deleteIds) {
      const attachment = attachments.find(
        (a) => a.case_attachment_id === attachmentId
      );
      if (attachment && attachment.file_path) {
        filesToDelete.push(attachment.file_path);
      }
      await CaseAttachment.destroy({
        where: { case_attachment_id: attachmentId },
        transaction,
      });
    }

    // Process replaces
    const files = Array.isArray(req.files) ? req.files : [];

    for (const attachmentId of replaceIds) {
      const fileKey = `replace_${attachmentId}`;
      const file = files.find((f) => f.fieldname === fileKey);

      if (!file) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Replacement file not found for attachment ${attachmentId}`,
        });
      }

      const attachment = attachments.find(
        (a) => a.case_attachment_id === attachmentId
      );

      if (attachment && attachment.file_path) {
        filesToReplace.push(attachment.file_path);
      }

      await CaseAttachment.update(
        {
          file_name: file.originalname,
          file_path: `/uploads/investigations/files/${file.filename}`,
        },
        {
          where: { case_attachment_id: attachmentId },
          transaction,
        }
      );
    }

    await transaction.commit();

    // Clean up old files asynchronously (after transaction commit)
    const cleanupFiles = [...filesToDelete, ...filesToReplace];
    cleanupFiles.forEach((filePath) => {
      if (filePath) {
        const relativePath = filePath.startsWith("/")
          ? filePath.slice(1)
          : filePath;
        const absolutePath = path.join(__dirname, "..", "public", relativePath);
        if (fs.existsSync(absolutePath)) {
          fs.unlink(absolutePath, () => {});
        }
      }
    });

    return res.status(200).json({
      message: `Successfully processed ${deleteIds.length} deletion(s) and ${replaceIds.length} replacement(s)`,
      deleted: deleteIds.length,
      replaced: replaceIds.length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error bulk updating attachments:", error);
    return res.status(500).json({
      message: "Failed to bulk update attachments",
      error: error.message,
    });
  }
};

exports.modifyRejectedEvidence = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const transaction = await sequelize.transaction();
    try {
      const { complaint_evidence_id } = req.params;
      const { action } = req.body; // 'delete' | 'replace'
      const userId = req.user?.id;

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({ error: "Authentication required" });
      }

      const evidence = await ComplaintEvidence.findByPk(complaint_evidence_id, {
        include: {
          model: Complaint,
          as: "complaint",
          attributes: ["applicant_id", "status"],
          required: true, // Use INNER JOIN to allow FOR UPDATE
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!evidence) {
        await transaction.rollback();
        return res.status(404).json({ error: "Evidence not found" });
      }

      console.log({ evidence });

      if (evidence.complaint.applicant_id !== userId) {
        await transaction.rollback();
        return res
          .status(403)
          .json({ error: "You can only modify evidences you uploaded" });
      }

      // TODO: Confirm the full list of complaint statuses that should allow evidence replacement
      const allowedStatuses = ["under_investigation"];
      if (!allowedStatuses.includes(evidence.complaint.status)) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot modify evidence in the current complaint status",
        });
      }

      if (evidence.status !== "rejected") {
        await transaction.rollback();
        return res
          .status(400)
          .json({ error: "Only rejected evidences can be modified" });
      }

      if (action === "delete") {
        const relativePath = evidence.file_path?.startsWith("/")
          ? evidence.file_path.slice(1)
          : evidence.file_path;
        const absolutePath = relativePath
          ? path.join(__dirname, "..", "public", relativePath)
          : null;

        await evidence.destroy({ transaction });
        await transaction.commit();

        if (absolutePath && fs.existsSync(absolutePath)) {
          fs.unlink(absolutePath, () => {});
        }

        return res
          .status(200)
          .json({ message: "Evidence deleted successfully" });
      }

      if (action === "replace") {
        const uploadedFile = Array.isArray(req.files) ? req.files[0] : null;

        if (!uploadedFile) {
          await transaction.rollback();
          return res
            .status(400)
            .json({ error: "No replacement file provided" });
        }

        const previousPath = evidence.file_path;

        // Persist relative public URL path (matches where multer stores evidence files)
        evidence.file_path = `/uploads/complaints/evidence/${uploadedFile.filename}`;
        evidence.file_type = uploadedFile.mimetype;
        evidence.status = "pending"; // back to uploaded/pending review; keep rejection_reason for history
        // Do not clear rejection_reason so history is preserved
        evidence.uploaded_by = userId;
        evidence.uploaded_at = new Date();

        console.log("Updated evidence:", { evidence });

        await evidence.save({ transaction });
        await transaction.commit();

        if (previousPath) {
          const relativePrevPath = previousPath.startsWith("/")
            ? previousPath.slice(1)
            : previousPath;
          const absolutePrevPath = path.join(
            __dirname,
            "..",
            "public",
            relativePrevPath
          );
          if (fs.existsSync(absolutePrevPath)) {
            fs.unlink(absolutePrevPath, () => {});
          }
        }

        return res.status(200).json({
          message: "Evidence replaced successfully",
          evidence,
        });
      }

      await transaction.rollback();
      return res.status(400).json({ error: "Invalid action" });
    } catch (error) {
      await transaction.rollback();

      const uploadedFile = Array.isArray(req.files) ? req.files[0] : null;
      if (uploadedFile && uploadedFile.path) {
        console.log("Cleanup path:", uploadedFile.path);
        if (fs.existsSync(uploadedFile.path)) {
          fs.unlink(uploadedFile.path, () => {});
        }
      }

      console.error("Error modifying rejected complaint evidence:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to modify evidence" });
    }
  });
};

exports.getExpiryCompliantRequest = async (req, res) => {
  try {
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    const oneYearTenMonthsAgo = new Date(now);
    oneYearTenMonthsAgo.setFullYear(now.getFullYear() - 1);
    oneYearTenMonthsAgo.setMonth(now.getMonth() - 10);

    const complaints = await Complaint.findAll({
      where: {
        get_user_id: null,
        created_at: { [Op.between]: [twoYearsAgo, oneYearTenMonthsAgo] },
      },
      order: [["created_at", "DESC"]],
    });

    const updatedComplaints = complaints.map((c) => {
      const created_at = new Date(c.created_at);
      const diffYears = (now - created_at) / (1000 * 60 * 60 * 24 * 365);
      return {
        ...c.toJSON(),
        isExpired: diffYears >= 2,
        isNearExpire: diffYears >= 1.83 && diffYears < 2,
      };
    });

    res.status(200).json({
      message: "Expiring complaints retrieved successfully",
      data: updatedComplaints,
      expiringCount: updatedComplaints.filter(
        (c) => c.isNearExpire || c.isExpired
      ).length,
    });
  } catch (err) {
    console.error("Error fetching expiring complaints:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getComplaintRejection = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { complaint_id } = req.params;

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate UUID
    if (!isUuid(complaint_id)) {
      return res.status(400).json({ message: "Invalid complaint id format" });
    }

    // Verify that the complaint belongs to the authenticated user
    const complaint = await Complaint.findOne({
      where: {
        complaint_id,
        applicant_id: userId,
      },
      attributes: ["complaint_id"],
    });

    if (!complaint) {
      return res.status(404).json({
        message:
          "Complaint not found or you don't have permission to access it",
      });
    }

    // Fetch all rejections for this complaint
    const complaintRejections = await ComplaintHasRejection.findAll({
      where: { complaint_id },
      attributes: [
        "complaint_rejection_id",
        "comment",
        "user_id",
        "customer_id",
        "createdAt",
        "updatedAt",
      ],
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
      message: "Complaint rejections retrieved successfully",
      data: complaintRejections,
    });
  } catch (error) {
    console.error("Error fetching complaint rejection:", error);
    return res.status(500).json({
      message: "Failed to fetch complaint rejection",
      error: error.message,
    });
  }
};
