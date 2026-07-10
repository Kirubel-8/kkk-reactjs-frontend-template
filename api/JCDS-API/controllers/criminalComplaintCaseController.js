"use strict";

const { sequelize } = require("../models");
const { Op } = require("sequelize");
const {
  Complaint,
  ComplaintEvidence,
  ComplaintWitness,
  CustomerAccount,
  ComplaintHasRejection,
  Case,
  CaseAttachment,
  CaseDecision,
  LetterReferenceNumber,
  StatusWithAgenda,
  User,
  Role,
  Permission,
  CaseType,
  Notification,
  DecisionRecommendation,
} = require("../models");
const { CouncilMembersReview } = require("../models");
const { v4: uuidv4 } = require("uuid");
const {
  CASE_STATUS,
  transitionFromHeadAction,
  transitionCaseDecision,
  deriveComplaintFlags,
  COMPLAINT_STATUS,
} = require("../utils/complaintCaseStatusHelper");

/**
 * Generates a simple case number.
 */
function generateCaseNumber() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `C-${ymd}-${rand}`;
}

/**
 * Checks if a user has a specific permission (resource/action).
 */
async function userHasPermission(userId, { resource, action }) {
  const user = await User.findOne({
    where: { user_id: userId },
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

  if (!user || !user.roles || user.roles.length === 0) return false;

  return user.roles.some((role) =>
    role.permissions?.some(
      (perm) => perm.resource === resource && perm.action === action
    )
  );
}

/**
 * Approves a complaint: creates a case and assigns to council members.
 * Returns { success: boolean, error?: string, data?: object }
 */
async function approveComplaint(complaintId, userId, transaction) {
  try {
    const complaint = await Complaint.findByPk(complaintId, { transaction });
    if (!complaint) {
      return { success: false, error: "Complaint not found" };
    }
    if (complaint.status !== "accepted") {
      return {
        success: false,
        error: `Complaint is not in accepted status (current: ${complaint.status})`,
      };
    }

    // Create case if one does not exist already
    let newCase = await Case.findOne({
      where: { complaint_id: complaint.complaint_id },
    });

    if (!newCase) {
      newCase = await Case.create(
        {
          case_id: require("uuid").v4(),
          complaint_id: complaint.complaint_id,
          case_number: generateCaseNumber(),
          status: CASE_STATUS.OPEN,
          assigned_committee: null,
          created_by: userId,
        },
        { transaction }
      );
    }

    // Update complaint/case status via centralized helper
    const { complaintStatus, caseStatus } = transitionFromHeadAction({
      currentComplaintStatus: complaint.status,
      currentCaseStatus: newCase.status,
      action: "approve_for_council",
    });

    complaint.status = complaintStatus;
    newCase.status = caseStatus;
    await complaint.save({ transaction });
    await newCase.save({ transaction });

    // Get all council members (users with caseDecision:decide permission)
    const councilUsers = await User.findAll({
      include: [
        {
          model: Role,
          as: "roles",
          include: [
            {
              model: Permission,
              as: "permissions",
              where: { resource: "caseDecision", action: "read" },
              required: true,
              attributes: [],
            },
          ],
          required: true,
        },
      ],
      transaction,
    });

    // Create unique set of member IDs (including the head)
    const uniqueMemberIds = new Set([
      userId,
      ...councilUsers.map((u) => u.user_id),
    ]);

    // Check for existing reviews to avoid duplicates
    const existingReviews = await CouncilMembersReview.findAll({
      where: {
        case_id: newCase.case_id,
        council_member_id: { [Op.in]: Array.from(uniqueMemberIds) },
      },
      transaction,
    });

    const existingMemberIds = new Set(
      existingReviews.map((r) => r.council_member_id)
    );
    const newMemberIds = Array.from(uniqueMemberIds).filter(
      (id) => !existingMemberIds.has(id)
    );

    // Create CouncilMembersReview records for new members only
    if (newMemberIds.length > 0) {
      await CouncilMembersReview.bulkCreate(
        newMemberIds.map((memberId) => ({
          council_members_review_id: require("uuid").v4(),
          case_id: newCase.case_id,
          council_head_id: userId,
          council_member_id: memberId,
          assigned_at: new Date(),
          is_eligable: false,
          decision: null,
          comment: null,
          reviewed_at: null,
        })),
        { transaction }
      );
    }

    // Send Notifications to the council members
    try {
      // Get all council member IDs (including the head)
      const councilMemberIds = Array.from(uniqueMemberIds);

      // if (councilMemberIds.length > 0) {
      //   // Create notifications for all council members
      //   const councilNotifications = await Promise.all(
      //     councilMemberIds.map((memberId) =>
      //       Notification.create({
      //         notification_id: uuidv4(),
      //         case_id: newCase.case_id,
      //         complaint_id: complaint.complaint_id,
      //         recipient_user_id: memberId,
      //         sender_id: userId,
      //         type: "system",
      //         title: "New case assigned for council review",
      //         message: `A new complaint case (${newCase.case_number}) has been assigned for council review. Case ID: ${newCase.case_id}`,
      //         is_read: false,
      //       }, { transaction })
      //     )
      //   );

      //   console.log(`[approveComplaint] Created ${councilNotifications.length} notifications for council members`);
      // }
    } catch (notifyErr) {
      // Do not fail the whole flow if notification fails
      console.error(
        "Failed to create council member notifications:",
        notifyErr
      );
    }

    return {
      success: true,
      data: { case: newCase, complaint },
    };
  } catch (err) {
    console.error(`Error approving complaint ${complaintId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Rejects a complaint: records rejection and moves back to investigation.
 * Returns { success: boolean, error?: string, data?: object }
 */
async function rejectComplaintLogic(complaintId, comment, userId, transaction) {
  try {
    const complaint = await Complaint.findByPk(complaintId, { transaction });
    if (!complaint) {
      return { success: false, error: "Complaint not found" };
    }
    const existingCase = await Case.findOne({
      where: { complaint_id: complaint.complaint_id },
      transaction,
    });

    // Record rejection
    await ComplaintHasRejection.create(
      {
        complaint_rejection_id: require("uuid").v4(),
        complaint_id: complaint.complaint_id,
        comment,
        user_id: userId,
      },
      { transaction }
    );

    // Update status via helper (send back to investigation)
    const { complaintStatus, caseStatus } = transitionFromHeadAction({
      currentComplaintStatus: complaint.status,
      currentCaseStatus: existingCase?.status || CASE_STATUS.OPEN,
      action: "reject_to_office",
    });
    complaint.status = complaintStatus;
    await complaint.save({ transaction });
    if (existingCase && caseStatus) {
      existingCase.status = caseStatus;
      await existingCase.save({ transaction });
    }

    // TODO: Send notification to the report dept head here (step - 2)
    // try {
    //   await Notification.create({
    //     notification_id: uuidv4(),
    //     complaint_id: complaint.complaint_id,
    //     recipient_user_id: complaint.get_user_id,
    //     sender_id: userId,
    //     type: "system",
    //     title: "Complaint Rejected",
    //     message: `Your complaint has been rejected. Reference: ${complaint.complaint_id}`,
    //     is_read: false,
    //   }, { transaction });
    // }
    // catch (notifyErr) {
    //   // Do not fail the whole flow if notification fails
    //   console.error("Failed to create report dept head notification:", notifyErr);
    // }

    return { success: true, data: { complaint } };
  } catch (err) {
    console.error(`Error rejecting complaint ${complaintId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Common include structure for complaint with applicant details
 */
const getComplaintInclude = () => [
  // { model: ComplaintEvidence, as: "evidences", required: false },
  // { model: ComplaintWitness, as: "witnesses", required: false },
  {
    model: CustomerAccount,
    as: "applicant",
    attributes: ["full_name", "email", "phone_number", "gender"],
    required: false
  },
];

const buildPagination = (count, currentPage, limit) => ({
  currentPage,
  totalPages: Math.ceil(count / limit),
  totalCount: count,
  hasNext: currentPage * limit < count,
  hasPrev: currentPage > 1,
});


// this endpoint is just for the council head and members
// it lists the cases that the user has access to (under-review/decided/returned by this user)
exports.listComplaintsAndCases = async (req, res) => {
  console.log("[listComplaintsAndCases] Starting request");

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { status = "all", caseStatus, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const hasReviewPermission = await userHasPermission(userId, {
      resource: "caseReview",
      action: "read",
    });
    const hasDecisionPermission = await userHasPermission(userId, {
      resource: "caseDecision",
      action: "read",
    });

    console.log("[listComplaintsAndCases] Permissions:", {
      hasReviewPermission,
      hasDecisionPermission,
      status,
      caseStatus,
    });

    if (!hasReviewPermission && !hasDecisionPermission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Handle case decision views (with caseStatus parameter)
    if (hasDecisionPermission && caseStatus) {
      const caseStatusValue = caseStatus === "closed" ? CASE_STATUS.CLOSED : CASE_STATUS.OPEN;
      
      console.log("[listComplaintsAndCases] branch 1 - Case status value:", caseStatusValue);
      const { count, rows } = await Case.findAndCountAll({
        subQuery: false,
        where: {
          [Op.or]: [
            { created_by: userId },
            { "$councilReviews.council_member_id$": userId },
            { "$councilReviews.council_head_id$": userId },
          ],
          status: caseStatusValue,
        },
        include: [
          {
            model: Complaint,
            as: "complaint",
            required: caseStatus === "open",
            ...(caseStatus === "open" ? { where: { status: "under_council_review" } } : {}),
            include: getComplaintInclude(),
          },
          {
            model: CouncilMembersReview,
            as: "councilReviews",
            required: false,
          },
        ],
        distinct: true,
        limit: limitNumber,
        offset,
        order: [["updatedAt", "ASC"]],
      });

      const cases = rows.map((caseRow) => {
        const json = caseRow.toJSON();
        const complaintJson = json.complaint || {};
        const flags = deriveComplaintFlags(complaintJson);
        return {
          ...json,
          complaint: { ...complaintJson, ...flags },
        };
      });

      return res.status(200).json({
        cases,
        pagination: buildPagination(count, pageNumber, limitNumber),
      });
    }

    // Handle case review views (hasReviewPermission)
    if (hasReviewPermission) {
      switch (status) {
        case "all": {
          // Get accepted complaints + cases (both open and closed) + returned to office complaints
          const [complaintsResult, casesResult, returnedComplaintsResult] =
            await Promise.all([
              Complaint.findAndCountAll({
                where: { status: COMPLAINT_STATUS.ACCEPTED },
                include: [
                  ...getComplaintInclude(),
                  {
                    model: ComplaintHasRejection,
                    as: "complaintRejection",
                    required: false,
                  },
                ],
                distinct: true,
                order: [["created_at", "ASC"]],
              }),
              Case.findAndCountAll({
                subQuery: false,
                where: {
                  [Op.or]: [
                    { status: CASE_STATUS.OPEN },
                    {
                      status: CASE_STATUS.CLOSED,
                      [Op.or]: [
                        { created_by: userId },
                        { "$councilReviews.council_member_id$": userId },
                        { "$councilReviews.council_head_id$": userId },
                      ],
                    },
                  ],
                },
                include: [
                  {
                    model: Complaint,
                    as: "complaint",
                    where: {
                      status: {
                        [Op.in]: [COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW, COMPLAINT_STATUS.DECIDED],
                      },
                    },
                    required: true,
                    include: getComplaintInclude(),
                  },
                  {
                    model: CouncilMembersReview,
                    as: "councilReviews",
                    required: false,
                  },
                ],
                distinct: true,
                order: [["createdAt", "ASC"]],
              }),
              Complaint.findAndCountAll({
                where: { status: COMPLAINT_STATUS.UNDER_INVESTIGATION },
                include: [
                  ...getComplaintInclude(),
                  {
                    model: ComplaintHasRejection,
                    as: "complaintRejection",
                    required: false,
                  },
                  {
                    model: Case,
                    as: "case",
                    required: true,
                    where: { status: CASE_STATUS.RETURNED_TO_OFFICE },
                    include: [
                      {
                        model: CaseAttachment,
                        as: "attachments",
                        required: false,
                      },
                    ],
                  },
                ],
                distinct: true,
                order: [["created_at", "ASC"]],
              }),
            ]);

          const allComplaints = [
            ...complaintsResult.rows,
            ...returnedComplaintsResult.rows,
          ];

          const totalCount =
            complaintsResult.count +
            casesResult.count +
            returnedComplaintsResult.count;

          const complaints = allComplaints.map((c) => {
            const json = c.toJSON();
            const flags = deriveComplaintFlags(json);
            return { ...json, ...flags };
          });

          const cases = casesResult.rows.map((caseRow) => {
            const json = caseRow.toJSON();
            const complaintJson = json.complaint || {};
            const flags = deriveComplaintFlags(complaintJson);
            return {
              ...json,
              complaint: { ...complaintJson, ...flags },
            };
          });

          return res.status(200).json({
            complaints,
            cases,
            pagination: buildPagination(totalCount, pageNumber, limitNumber),
          });
        }

        case "accepted": {
          const { count, rows: complaints } = await Complaint.findAndCountAll({
            where: { status: COMPLAINT_STATUS.ACCEPTED },
            include: getComplaintInclude(),
            distinct: true,
            limit: limitNumber,
            offset,
            order: [["created_at", "ASC"]],
          });

          return res.status(200).json({
            complaints,
            pagination: buildPagination(count, pageNumber, limitNumber),
          });
        }

        case "under_council_review": {
          const { count, rows: cases } = await Case.findAndCountAll({
            where: { status: CASE_STATUS.OPEN },
            include: [
              {
                model: Complaint,
                as: "complaint",
                where: { status: COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW },
                include: getComplaintInclude(),
              },
            ],
            distinct: true,
            limit: limitNumber,
            offset,
            order: [["createdAt", "ASC"]],
          });

          return res.status(200).json({
            cases,
            pagination: buildPagination(count, pageNumber, limitNumber),
          });
        }

        case "rejected": {
          const { count, rows: complaints } = await Complaint.findAndCountAll({
            where: { status: COMPLAINT_STATUS.UNDER_INVESTIGATION },
            include: [
              ...getComplaintInclude(),
              { model: ComplaintHasRejection, as: "complaintRejection" },
              {
                model: Case,
                as: "case",
                required: true,
                where: { status: CASE_STATUS.RETURNED_TO_OFFICE },
                include: [
                  {
                    model: CaseAttachment,
                    as: "attachments",
                    required: false,
                  },
                ],
              },
            ],
            distinct: true,
            limit: limitNumber,
            offset,
            order: [["created_at", "ASC"]],
          });

          return res.status(200).json({
            complaints,
            pagination: buildPagination(count, pageNumber, limitNumber),
          });
        }

        case "closed": {
          const { count, rows } = await Case.findAndCountAll({
            subQuery: false,
            where: {
              [Op.or]: [
                { created_by: userId },
                { "$councilReviews.council_member_id$": userId },
                { "$councilReviews.council_head_id$": userId },
              ],
              status: CASE_STATUS.CLOSED,
            },
            include: [
              {
                model: Complaint,
                as: "complaint",
                required: false,
                include: getComplaintInclude(),
              },
              {
                model: CouncilMembersReview,
                as: "councilReviews",
                required: false,
              },
            ],
            distinct: true,
            limit: limitNumber,
            offset,
            order: [["updatedAt", "ASC"]],
          });

          const cases = rows.map((caseRow) => {
            const json = caseRow.toJSON();
            const complaintJson = json.complaint || {};
            const flags = deriveComplaintFlags(complaintJson);
            return {
              ...json,
              complaint: { ...complaintJson, ...flags },
            };
          });

          return res.status(200).json({
            cases,
            pagination: buildPagination(count, pageNumber, limitNumber),
          });
        }

        default:
          return res.status(400).json({ error: "Invalid status parameter" });
      }
    }

    // Fallback for decision permission without caseStatus
    if (hasDecisionPermission) {
      const { count, rows } = await Case.findAndCountAll({
        subQuery: false,
        where: {
          [Op.or]: [
            { created_by: userId },
            { "$councilReviews.council_member_id$": userId },
            { "$councilReviews.council_head_id$": userId },
          ],
          status: CASE_STATUS.OPEN,
        },
        include: [
          {
            model: Complaint,
            as: "complaint",
            required: true,
            where: { status: COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW },
            include: getComplaintInclude(),
          },
          {
            model: CouncilMembersReview,
            as: "councilReviews",
            required: false,
          },
        ],
        distinct: true,
        limit: limitNumber,
        offset,
        order: [["updatedAt", "ASC"]],
      });

      const cases = rows.map((caseRow) => {
        const json = caseRow.toJSON();
        const complaintJson = json.complaint || {};
        const flags = deriveComplaintFlags(complaintJson);
        return {
          ...json,
          complaint: { ...complaintJson, ...flags },
        };
      });

      return res.status(200).json({
        cases,
        pagination: buildPagination(count, pageNumber, limitNumber),
      });
    }
  } catch (error) {
    console.error("[listComplaintsAndCases] Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Lists cases for the office table (cases only) with status + pagination filters.
 */
exports.getComplaintCases = async (req, res) => {
  try {
    // Check the user id
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get the status and page and limit from the query parameters
    const { status = "all", page = 1, limit = 10 } = req.query;
    const allowedStatuses = [
      "all",
      "returned",
      "accepted",
      "closed",
      "under_council_review",
      "decided",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status parameter" });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    // Check which permissoin the user has (review permission or decision permission)
    const hasReviewPermission = await userHasPermission(userId, {
      resource: "caseReview",
      action: "read",
    });
    const hasDecisionPermission = await userHasPermission(userId, {
      resource: "caseDecision",
      action: "read",
    });

    if (!hasReviewPermission && !hasDecisionPermission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Build the where clause for the cases and complaints
    let caseWhere = {};
    let complaintWhere = {};

    switch (status) {
      case "returned":
        caseWhere.status = CASE_STATUS.RETURNED_TO_OFFICE;
        break;
      case "accepted":
        complaintWhere.status = COMPLAINT_STATUS.ACCEPTED;
        caseWhere.status = {
          [Op.in]: [CASE_STATUS.OPEN, CASE_STATUS.BACK_TO_COUNCIL],
        };
        break;
      case "under_council_review":
        caseWhere.status = CASE_STATUS.OPEN;
        complaintWhere.status = "under_council_review";
        break;
      case "closed":
      case "decided":
        caseWhere.status = CASE_STATUS.CLOSED;
        complaintWhere.status = "Decided";
        break;
      case "all":
        caseWhere.status = {
          [Op.in]: [
            CASE_STATUS.OPEN,
            CASE_STATUS.CLOSED,
            CASE_STATUS.RETURNED_TO_OFFICE,
            CASE_STATUS.BACK_TO_COUNCIL,
          ],
        };
        complaintWhere.status = {
          [Op.in]: [
            COMPLAINT_STATUS.UNDER_COUNCIL_REVIEW,
            COMPLAINT_STATUS.DECIDED,
            COMPLAINT_STATUS.ACCEPTED,
            COMPLAINT_STATUS.UNDER_INVESTIGATION,
          ],
        };
        break;
      default:
        return res.status(400).json({ error: "Unsupported status parameter" });
    }

    const complaintInclude = {
      model: Complaint,
      as: "complaint",
      required: true,
      include: [
        ...getComplaintInclude(),
      ],
      ...(Object.keys(complaintWhere).length ? { where: complaintWhere } : {}),
    };

    const { count, rows } = await Case.findAndCountAll({
      subQuery: false,
      where: caseWhere,
      include: [
        complaintInclude,
      ],
      distinct: true,
      limit: limitNumber,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const cases = rows.map((caseRow) => {
      const json = caseRow.toJSON();
      const complaintJson = json.complaint || {};
      const flags = deriveComplaintFlags(complaintJson);
      return {
        ...json,
        complaint: { ...complaintJson, ...flags },
      };
    });

    console.log("Returning cases:", cases);

    return res.status(200).json({
      cases,
      pagination: buildPagination(count, pageNumber, limitNumber),
    });
  } catch (error) {
    console.error("getComplaintCases error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Bulk approve or reject complaints.
 * Best-effort processing: returns successful and failed IDs.
 */
exports.bulkApproveReject = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: "Unauthorized" });
    }

    const permitted = await userHasPermission(userId, {
      resource: "caseReview",
      action: "approve",
    });

    if (!permitted) {
      await t.rollback();
      return res.status(403).json({ error: "Forbidden" });
    }

    const { complaint_ids, action, comment } = req.body || {};

    if (
      !complaint_ids ||
      !Array.isArray(complaint_ids) ||
      complaint_ids.length === 0
    ) {
      await t.rollback();
      return res.status(400).json({ error: "complaint_ids array is required" });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "action must be 'approve' or 'reject'" });
    }

    if (action === "reject" && (!comment || !comment.trim())) {
      await t.rollback();
      return res.status(400).json({ error: "rejection comment is required" });
    }

    const successful = [];
    const failed = [];

    // Process each complaint
    for (const complaintId of complaint_ids) {
      const result =
        action === "approve"
          ? await approveComplaint(complaintId, userId, t)
          : await rejectComplaintLogic(complaintId, comment, userId, t);

      if (result.success) {
        successful.push(complaintId);
      } else {
        failed.push({ id: complaintId, error: result.error });
      }
    }

    // Commit all operations
    await t.commit();

    return res.status(200).json({
      message: `Processed ${successful.length} complaints successfully`,
      successful,
      failed,
    });
  } catch (err) {
    await t.rollback();
    console.error("bulkApproveReject error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Gets a single complaint for council head review.
 * Allows viewing complaints with status: accepted, under_council_review, or Decided.
 */
exports.getComplaintForReviewById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const permitted = await userHasPermission(userId, {
      resource: "caseReview",
      action: "read",
    });
    if (!permitted) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Complaint id is required" });

    const complaint = await Complaint.findByPk(id, {
      include: [
        ...getComplaintInclude(),
        {
          model: ComplaintHasRejection,
          as: "complaintRejection",
          required: false,
          attributes: ["complaint_rejection_id", "comment", "createdAt"],
        },
        {
          model: Case,
          as: "case",
          required: false,
          include: [
            { model: CaseAttachment, as: "attachments" },
            {
              model: DecisionRecommendation,
              as: "decisionRecommendations",
              required: false,
              include: [
                {
                  model: StatusWithAgenda,
                  as: "status",
                  attributes: ["status_id", "name"],
                },
                {
                  model: User,
                  as: "user",
                  attributes: ["user_id", "full_name", "email"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!complaint)
      return res.status(404).json({ error: "Complaint not found" });

    // Allow viewing complaints in accepted, under_council_review, or Decided status
    const allowedStatuses = [
      "under_investigation",
      "accepted",
      "under_council_review",
      "Decided",
    ];
    if (!allowedStatuses.includes(complaint.status)) {
      return res.status(400).json({
        error: `Complaint is not in a viewable status. Current status: ${
          complaint.status
        }. Allowed statuses: ${allowedStatuses.join(", ")}`,
      });
    }

    // Process recommendations: get the most recent one per user
    const complaintJson = complaint.toJSON();
    if (
      complaintJson.case?.decisionRecommendations &&
      Array.isArray(complaintJson.case.decisionRecommendations)
    ) {
      // Sort by created_at descending
      const sorted = complaintJson.case.decisionRecommendations.sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });

      // Group by user_id and keep only the most recent one per user
      const userRecommendations = new Map();
      sorted.forEach((rec) => {
        const userId = rec.user_id;
        if (!userRecommendations.has(userId)) {
          userRecommendations.set(userId, rec);
        }
      });

      complaintJson.case.decisionRecommendations = Array.from(
        userRecommendations.values()
      );
    }

    return res.status(200).json(complaintJson);
  } catch (err) {
    console.error("getComplaintForReviewById error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Approves a complaint: creates a Case and moves complaint to under_council_review.
 */
exports.approveComplaintForCaseReview = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: "Unauthorized" });
    }
    const permitted = await userHasPermission(userId, {
      resource: "caseReview",
      action: "approve",
    });
    if (!permitted) {
      await t.rollback();
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    if (!id) {
      await t.rollback();
      return res.status(400).json({ error: "Complaint id is required" });
    }

    const result = await approveComplaint(id, userId, t);

    // validate the the case has at least one attachment
    if (result.success) {
      const caseId = result.data.case.case_id;
      const attachmentCount = await CaseAttachment.count({
        where: { case_id: caseId },
        transaction: t,
      });

      if (attachmentCount === 0) {
        await t.rollback();
        return res.status(400).json({
          error:
            "Cannot approve case without at least one investigation attachment",
        });
      }
    }

    if (!result.success) {
      await t.rollback();
      if (result.error === "Complaint not found") {
        return res.status(404).json({ error: result.error });
      }
      if (result.error.includes("not in accepted status")) {
        return res.status(400).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    await t.commit();
    return res.status(200).json({
      message: "Complaint approved and case created",
      ...result.data,
    });
  } catch (err) {
    await t.rollback();
    console.error("approveComplaintForCaseReview error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects a complaint: records rejection and moves back to under_investigation.
 */
exports.rejectComplaintForCaseReview = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: "Unauthorized" });
    }
    const permitted = await userHasPermission(userId, {
      resource: "caseReview",
      action: "reject",
    });
    if (!permitted) {
      await t.rollback();
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const { comment } = req.body || {};
    if (!id) {
      await t.rollback();
      return res.status(400).json({ error: "Complaint id is required" });
    }
    if (!comment || !comment.trim()) {
      await t.rollback();
      return res.status(400).json({ error: "Rejection comment is required" });
    }

    const result = await rejectComplaintLogic(id, comment, userId, t);

    if (!result.success) {
      await t.rollback();
      if (result.error === "Complaint not found") {
        return res.status(404).json({ error: result.error });
      }
      return res.status(500).json({ error: result.error });
    }

    await t.commit();
    return res.status(200).json({
      message: "Complaint rejected and sent back for investigation",
      ...result.data,
    });
  } catch (err) {
    await t.rollback();
    console.error("rejectComplaintForCaseReview error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Gets a case (with complaint) for viewing or decision-making.
 * Allows viewing both open cases (under_council_review) and closed cases (Decided).
 */
exports.getCaseDetailForDecision = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const permitted = await userHasPermission(userId, {
      resource: "caseDecision",
      action: "read",
    });
    if (!permitted) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params; // case id
    if (!id) return res.status(400).json({ error: "Case id is required" });

    const caseRow = await Case.findByPk(id, {
      include: [
        {
          model: Complaint,
          as: "complaint",
          include: getComplaintInclude(),
        },
        { model: CaseAttachment, as: "attachments" },
        {
          model: CaseDecision,
          as: "decision",
          required: false,
          include: [
            {
              model: StatusWithAgenda,
              as: "status",
              attributes: ["status_id", "name"],
            },
            {
              model: LetterReferenceNumber,
              as: "letterRef",
              attributes: ["reference_id", "reference_number"],
            },
          ],
        },
        {
          model: DecisionRecommendation,
          as: "decisionRecommendations",
          required: false,
          include: [
            {
              model: StatusWithAgenda,
              as: "status",
              attributes: ["status_id", "name"],
            },
            {
              model: User,
              as: "user",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
        },
      ],
    });

    if (!caseRow) return res.status(404).json({ error: "Case not found" });

    // Verify user has access to this case (created by them or assigned to them)
    // This matches the access logic in listComplaintsAndCases
    const hasAccess =
      caseRow.created_by === userId ||
      !!(await CouncilMembersReview.findOne({
        where: {
          case_id: caseRow.case_id,
          council_member_id: userId,
        },
      }));

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this case" });
    }

    // Allow viewing if complaint is under_council_review (open) or Decided (closed)
    if (
      !caseRow.complaint ||
      !["under_council_review", "Decided"].includes(caseRow.complaint.status)
    ) {
      return res
        .status(400)
        .json({ error: "Case complaint is not in a valid state for viewing" });
    }

    // Process recommendations: get the most recent one per user
    const caseJson = caseRow.toJSON();
    if (
      caseJson.decisionRecommendations &&
      Array.isArray(caseJson.decisionRecommendations)
    ) {
      // Sort by created_at descending
      const sorted = caseJson.decisionRecommendations.sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });

      // Group by user_id and keep only the most recent one per user
      const userRecommendations = new Map();
      sorted.forEach((rec) => {
        const userId = rec.user_id;
        if (!userRecommendations.has(userId)) {
          userRecommendations.set(userId, rec);
        }
      });

      caseJson.decisionRecommendations = Array.from(
        userRecommendations.values()
      );
    }

    return res.status(200).json(caseJson);
  } catch (err) {
    console.error("getCaseDetailForDecision error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Makes a council decision on a case.
 */
exports.makeDecisionOnCase = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: "Unauthorized" });
    }
    const permitted = await userHasPermission(userId, {
      resource: "caseDecision",
      action: "decide",
    });
    if (!permitted) {
      await t.rollback();
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params; // case id
    const {
      decision_status_id, // StatusWithAgenda.status_id
      letter_ref_number,
      external_decision,
      external_decision_document,
    } = req.body || {};

    if (!id) {
      await t.rollback();
      return res.status(400).json({ error: "Case id is required" });
    }
    if (!decision_status_id) {
      await t.rollback();
      return res.status(400).json({ error: "decision_status_id is required" });
    }

    const caseRow = await Case.findByPk(id, {
      include: [{ model: Complaint, as: "complaint" }],
      where: { status: CASE_STATUS.OPEN },
      transaction: t,
    });
    if (!caseRow) {
      await t.rollback();
      return res.status(404).json({ error: "Case not found" });
    }
    if (
      !caseRow.complaint ||
      caseRow.complaint.status !== "under_council_review"
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Case is not ready for council decision" });
    }

    const statusExists = await StatusWithAgenda.findByPk(decision_status_id, {
      transaction: t,
    });
    if (!statusExists) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid decision_status_id" });
    }

    // Extract file paths from multer upload (upload middleware uses .any())
    const files = Array.isArray(req.files) ? req.files : [];
    const decisionFile = files.find((f) => f.fieldname === "decision_document");
    const externalDecisionFile = files.find(
      (f) => f.fieldname === "external_decision_document"
    );
    const decision_document = decisionFile
      ? `/uploads/complaints/others/${decisionFile.filename}`
      : null;
    const external_decision_document_file = externalDecisionFile
      ? `/uploads/complaints/others/${externalDecisionFile.filename}`
      : null;

    const decision = await CaseDecision.create(
      {
        decision_id: require("uuid").v4(),
        case_id: caseRow.case_id,
        decision_status: decision_status_id,
        decision_document,
        external_decision: external_decision || null,
        external_decision_document: external_decision_document_file || null,
        updated_by: req.user?.id,
      },
      { transaction: t }
    );

    const { complaintStatus, caseStatus } = transitionCaseDecision({
      currentComplaintStatus: caseRow.complaint.status,
      currentCaseStatus: caseRow.status,
    });

    caseRow.status = caseStatus;
    await caseRow.save({ transaction: t });

    caseRow.complaint.status = complaintStatus;
    await caseRow.complaint.save({ transaction: t });

    await t.commit();
    return res.status(200).json({
      message: "Decision recorded",
      decision,
      case: caseRow,
      complaint: caseRow.complaint,
    });
  } catch (err) {
    await t.rollback();
    console.error("makeDecisionOnCase error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Lists available decision statuses based on configured agendas (no permission branching here).
 */
exports.getDecisionStatuses = async (req, res) => {
  try {
    console.log("Getting decision statuses");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    // const permitted = await userHasPermission(userId, {
    //   resource: "caseDecision",
    //   action: "read",
    // });
    // if (!permitted) return res.status(403).json({ error: "Forbidden" });

    const statuses = await StatusWithAgenda.findAll({
      order: [["name", "ASC"]],
    });
    console.log({ statuses });
    return res.status(200).json(statuses);
  } catch (err) {
    console.error("getDecisionStatuses error:", err);
    return res.status(500).json({ error: err.message });
  }
};
