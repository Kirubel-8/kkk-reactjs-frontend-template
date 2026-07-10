const { where } = require("sequelize");
const {
  sequelize,
  Case,
  Notification,
  Log,
  User,
  Department,
  DisciplinaryComplaint,
  DisciplinaryComplaintIssue,
  DisciplinaryComplaintEvidence,
  CustomerAccount,
  CaseAttachment,
  ExpertAttachment,
  CommitteeMembersReview,
  CaseType,
  Sequelize,
  StatusWithAgenda,
  Role,
  Permission,
} = require("../models");
const { v4: uuidv4 } = require("uuid");

// Get all cases assigned to the logged-in user's department
exports.getAssignedCases = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!department_id) {
    return res
      .status(400)
      .json({ error: "User department information is required" });
  }

  try {
    console.log(
      "[getAssignedCases] Fetching cases for department:",
      department_id
    );

    // Get all cases assigned to the user's department
    console.log(Object.keys(sequelize.models));

    const cases = await Case.findAll({
      where: { assigned_committee: department_id },
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["full_name", "email", "phone_number"],
            },
            {
              model: DisciplinaryComplaintIssue,
              as: "issues",
              separate: true,
            },
            {
              model: DisciplinaryComplaintEvidence,
              as: "evidences",
              separate: true,
            },
          ],
        },
        {
          model: Department,
          as: "assigned_committee_ref",
          attributes: ["department_id", "name"],
        },
        {
          model: CaseAttachment,
          as: "attachments",
          required: false,
        },
        {
          model: ExpertAttachment,
          as: "expert_attachments",
          required: false,
        },
        {
          model: CaseType,
          as: "caseType",
          attributes: ["case_type_id", "name"],
        },
      ],
      order: [
        ["committee_priority", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    // Transform the response to include review status for each case
    const casesWithReviewStatus = cases.map((caseItem) => {
      const caseData = caseItem.toJSON();
      return {
        ...caseData,
        has_user_reviewed:
          caseData.committee_reviews && caseData.committee_reviews.length > 0,
        user_review: caseData.committee_reviews
          ? caseData.committee_reviews[0]
          : null,
      };
    });

    console.log(
      `[getAssignedCases] Found ${cases.length} cases for department ${department_id}`
    );

    return res.status(200).json({
      message: "Assigned cases retrieved successfully",
      data: {
        cases: casesWithReviewStatus,
        total_count: cases.length,
        department: cases[0]?.assigned_committee_ref || {
          department_id,
          name: "Unknown",
        },
      },
    });
  } catch (error) {
    console.error("Get Assigned Cases Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Get specific case detail with user's review status
exports.getAssignedCaseDetail = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;
  const { id } = req.params;
  const case_id = id;

  if (!userId) return res.status(401).json({ error: "You are not logged in" });
  if (!case_id) return res.status(400).json({ error: "Case ID is required" });

  try {
    const foundCase = await Case.findOne({
      where: {
        case_id,
        assigned_committee: department_id,
      },
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["full_name", "email", "phone_number"],
            },
            { model: DisciplinaryComplaintIssue, as: "issues", separate: true },
            {
              model: DisciplinaryComplaintEvidence,
              as: "evidences",
              separate: true,
            },
          ],
        },
        {
          model: Department,
          as: "assigned_committee_ref",
          attributes: ["department_id", "name"],
          include: [
            {
              model: User,
              as: "users",
              attributes: ["user_id", "full_name", "email"],
            },
          ],
        },
        {
          model: CaseType,
          as: "caseType",
          attributes: ["case_type_id", "name"],
          required: false, // Use false if case_type might be null
        },
        { model: CaseAttachment, as: "attachments", required: false },
        { model: ExpertAttachment, as: "expert_attachments", required: false },
      ],
    });

    if (!foundCase)
      return res
        .status(404)
        .json({ message: "Case not found or not assigned to your department" });

    const caseData = foundCase.toJSON();
    console.log("Case Data with CaseType:", {
      case_id: caseData.case_id,
      case_type: caseData.case_type,
      caseType: caseData.caseType,
      hasCaseType: !!caseData.caseType,
    });
    return res.status(200).json({
      message: "Assigned case detail retrieved successfully",
      data: {
        ...caseData,
        has_user_reviewed: caseData.committee_reviews?.length > 0,
        user_review: caseData.committee_reviews?.[0] || null,
      },
    });
  } catch (error) {
    console.error("Get Assigned Case Detail Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Select case and notify department members (experts)
exports.selectCaseAndInformExperts = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;
  const { case_id } = req.params;
  const meetingDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!department_id) {
    return res
      .status(400)
      .json({ error: "User department information is required" });
  }

  const t = await sequelize.transaction();

  try {
    // Find the case assigned to the user's department
    const foundCase = await Case.findOne({
      where: { case_id, assigned_committee: department_id },
      include: [
        { model: Department, as: "assigned_committee_ref" },
        { model: CaseType, as: "caseType" },
        // {
        //   model: User,
        //   as: "assigned_expert_ref",
        //   attributes: ["user_id", "full_name", "email"],
        // },
      ],
      transaction: t,
    });

    if (!foundCase) {
      await t.rollback();
      return res.status(404).json({
        message: "Case not found or not assigned to your department",
      });
    }

    // Check if case type is assigned
    if (!foundCase.case_type) {
      await t.rollback();
      return res.status(400).json({
        error: "Case type must be assigned before selecting the case",
      });
    }

    // Update the case to selected
    await foundCase.update(
      {
        committee_priority: "selected_for_meeting",
        status: "under judiciary expert",
        updated_by: userId,
        meeting_date: meetingDate,
      },
      { transaction: t }
    );

    // Get all users with attach_expert_file permission (experts) in this department
    let experts = [];
    try {
      experts = await User.findAll({
        where: { department_id },
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
                where: {
                  resource: "DepartmentCommittee",
                  action: "attach_expert_file",
                },
                required: true,
                attributes: [],
              },
            ],
            required: true,
          },
        ],
        attributes: ["user_id", "full_name", "email"],
        transaction: t,
      });
      console.log(
        `[selectCaseAndInformExperts] Found ${experts.length} experts in department with attach_expert_file permission`
      );
    } catch (expertQueryErr) {
      console.error("Failed to query experts:", expertQueryErr);
    }

    // Select ONE random expert to assign the case
    let assignedExpert = null;
    let assignedExpertId = null;

    if (experts.length > 0) {
      // Select random expert from the list
      assignedExpert = experts[Math.floor(Math.random() * experts.length)];
      assignedExpertId = assignedExpert.user_id;
      console.log("assigned experts", assignedExpertId);
      // Update case with assigned expert
      await foundCase.update(
        {
          assigned_expert: assignedExpertId, // Add this field to your Case model
          updated_by: userId,
        },
        { transaction: t }
      );

      console.log(
        `[selectCaseAndInformExperts] Assigned case to expert: ${assignedExpert.full_name} (${assignedExpertId})`
      );
    }

    // Get all members of this department (including experts)
    const departmentMembers = await User.findAll({
      where: { department_id },
      attributes: ["user_id", "full_name", "email"],
      transaction: t,
    });

    // Create notifications for ALL department members
    const notifications = departmentMembers.map((member) => {
      // Check if this member is the assigned expert
      const isAssignedExpert = member.user_id === assignedExpertId;

      return {
        notification_id: uuidv4(),
        case_id,
        recipient_user_id: member.user_id,
        title: isAssignedExpert
          ? "Case assigned for expert file attachment"
          : "New case selected for review",
        message: isAssignedExpert
          ? `You have been assigned as the expert for case (${foundCase.case_number}). Please attach the required expert files. Case ID: ${case_id}`
          : `A new case (${foundCase.case_number}) has been selected for review in your department.`,
        type: "system",
        is_read: false,
        sender_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications, { transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      message: "Case selected and members notified successfully",
      data: {
        case_id: foundCase.case_id,
        case_number: foundCase.case_number,
        department: foundCase.assigned_committee_ref.name,
        case_type: foundCase.caseType?.name,
        assigned_expert: assignedExpert
          ? {
              user_id: assignedExpert.user_id,
              full_name: assignedExpert.full_name,
              email: assignedExpert.email,
            }
          : null,
        total_notified: notifications.length,
        experts_count: experts.length,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Select Case and Inform Experts Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
exports.assignCaseType = async (req, res) => {
  const userId = req.user?.id;
  const { case_id } = req.params;
  const { case_type_id } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!case_type_id) {
    return res.status(400).json({ error: "Case type ID is required" });
  }

  const t = await sequelize.transaction();

  try {
    // Verify case exists
    const foundCase = await Case.findOne({
      where: { case_id },
      transaction: t,
    });

    if (!foundCase) {
      await t.rollback();
      return res.status(404).json({ error: "Case not found" });
    }

    // Verify case type exists
    const caseType = await CaseType.findOne({
      where: { case_type_id },
      transaction: t,
    });

    if (!caseType) {
      await t.rollback();
      return res.status(404).json({ error: "Case type not found" });
    }

    // Update the case with case type
    await foundCase.update(
      {
        case_type: case_type_id,
        updated_by: userId,
      },
      { transaction: t }
    );

    await t.commit();
    console.log("case type id", case_type_id);
    return res.status(200).json({
      message: "Case type assigned successfully",
      data: {
        case_id: foundCase.case_id,
        case_number: foundCase.case_number,
        case_type_id: case_type_id,
        case_type_name: caseType.name,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Assign Case Type Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
// Add this to your informExpert controller
exports.getCaseTypes = async (req, res) => {
  try {
    const caseTypes = await CaseType.findAll({
      attributes: ["case_type_id", "name"],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      message: "Case types fetched successfully",
      data: caseTypes,
    });
  } catch (error) {
    console.error("Get Case Types Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    const notifications = await Notification.findAll({
      where: { recipient_user_id: userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error); // log full error in server
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message || error.toString(),
    });
  }
};
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const [updatedCount] = await Notification.update(
      { is_read: true },
      {
        where: { recipient_user_id: userId, is_read: false },
      }
    );

    if (updatedCount === 0) {
      return res.status(200).json({
        message: "All notifications are already read",
        updatedCount: 0,
      });
    }

    res.status(200).json({
      message: "All notifications marked as read successfully",
      updatedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      message: "Error marking notifications as read",
      error: error.message || error.toString(),
    });
  }
};
//  Here Mark a single notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    // Update only if the notification belongs to the user
    const [updatedCount] = await Notification.update(
      { is_read: true },
      { where: { notification_id: notificationId, recipient_user_id: userId } }
    );

    if (updatedCount === 0) {
      return res
        .status(404)
        .json({ message: "Notification not found or already read" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

exports.getSelectedCases = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!department_id) {
    return res
      .status(400)
      .json({ error: "User department information is required" });
  }

  try {
    // Fetch all selected cases for the logged-in user's department
    const selectedCases = await Case.findAll({
      where: {
        assigned_committee: department_id,
        committee_priority: "selected",
        status: "under judiciary expert",
      },
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["full_name", "email", "phone_number"],
            },
            {
              model: DisciplinaryComplaintIssue,
              as: "issues",
              separate: true,
            },
            {
              model: DisciplinaryComplaintEvidence,
              as: "evidences",
              separate: true,
            },
          ],
        },
        {
          model: Department,
          as: "assigned_committee_ref",
          attributes: ["department_id", "name"],
        },
        {
          model: CaseAttachment,
          as: "attachments",
          required: false,
        },
        {
          model: ExpertAttachment,
          as: "expert_attachments",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Selected cases retrieved successfully",
      data: {
        total_count: selectedCases.length,
        cases: selectedCases,
      },
    });
  } catch (error) {
    console.error("Get Selected Cases Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Committee members attach files to selected cases
exports.attachFilesToSelectedCase = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;
  const { case_id } = req.params;
  const { description } = req.body;

  if (!userId) return res.status(401).json({ error: "You are not logged in" });
  if (!case_id) return res.status(400).json({ error: "Case ID is required" });

  const t = await sequelize.transaction();

  try {
    // Verify case exists, in department, and selected
    const caseRecord = await Case.findOne({
      where: {
        case_id,
        assigned_committee: department_id,
        committee_priority: "selected_for_meeting",
        status: ["under judiciary expert", "back to committee"],
      },
      transaction: t,
    });

    if (!caseRecord) {
      await t.rollback();
      return res.status(404).json({
        error:
          "Case not found, not in your department, or not selected for review",
      });
    }

    // Process uploaded files
    const incomingFiles = req.files || [];
    if (!incomingFiles.length) {
      await t.rollback();
      return res.status(400).json({ error: "No files uploaded" });
    }

    const attachmentsToCreate = [];

    for (const file of incomingFiles) {
      // Store relative path instead of absolute path
      const relativePath = `/expert-documents/${file.filename}`;

      const attachment = await ExpertAttachment.create(
        {
          expert_attachment_id: require("uuid").v4(),
          case_id,
          document_name: file.originalname,
          document_path: relativePath, // Store relative path
          document_status: "pending",
          description:
            description || `Committee member attachment - ${file.originalname}`,
          uploaded_by: userId,
        },
        { transaction: t }
      );

      attachmentsToCreate.push(attachment);
    }
    await Case.update(
      {
        status: "back to committee",
        updated_by: userId,
        updated_at: new Date(),
      },
      { where: { case_id }, transaction: t }
    );
    // Notify department head via updated_by
    if (caseRecord.updated_by) {
      await Notification.create(
        {
          notification_id: require("uuid").v4(),
          case_id,
          recipient_user_id: caseRecord.updated_by,
          sender_id: userId,
          type: "in_app",
          title: "Files Attached to Case",
          message: `Committee member attached ${attachmentsToCreate.length} file(s) to case ${caseRecord.case_number}`,
          is_read: false,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(200).json({
      message: "Files attached to case successfully",
      data: {
        case_id,
        case_number: caseRecord.case_number,
        attachments_count: attachmentsToCreate.length,
        attachments: attachmentsToCreate.map((att) => ({
          expert_attachment_id: att.expert_attachment_id,
          document_name: att.document_name,
          document_path: att.document_path, // This will now be relative path
          document_status: att.document_status,
          uploaded_at: att.createdAt,
        })),
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Attach Files to Selected Case Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
};

// Committee head updates case status and priority
exports.updateCaseStatusAndPriority = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;
  const { id } = req.params; // case_id
  const { status, committee_priority } = req.body;

  if (!userId) return res.status(401).json({ error: "You are not logged in" });
  if (!id) return res.status(400).json({ error: "Case ID is required" });

  try {
    // Check if the case belongs to the user's committee
    const foundCase = await Case.findOne({
      where: {
        case_id: id,
        assigned_committee: department_id,
      },
    });

    if (!foundCase) {
      return res.status(404).json({
        message: "Case not found or not assigned to your department",
      });
    }

    // Update only provided fields
    if (status) foundCase.status = status;
    if (committee_priority !== undefined)
      foundCase.committee_priority = committee_priority;

    await foundCase.save();

    console.log(
      `[updateCaseStatusAndPriority] Case ${id} updated by user ${userId}`
    );

    return res.status(200).json({
      message: "Case status and committee priority updated successfully",
      data: foundCase,
    });
  } catch (error) {
    console.error("Update Case Status & Priority Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Get all expert attachments for a case
exports.getExpertAttachmentsByCase = async (req, res) => {
  const userId = req.user?.id;
  const { department_id } = req.user;
  const { case_id } = req.params;

  if (!userId) return res.status(401).json({ error: "You are not logged in" });
  if (!case_id) return res.status(400).json({ error: "Case ID is required" });

  try {
    const attachments = await ExpertAttachment.findAll({
      where: { case_id },
      include: [
        {
          model: User,
          as: "uploader",
          attributes: ["user_id", "full_name", "email"],
        },
      ],
    });

    if (!attachments.length)
      return res
        .status(404)
        .json({ message: "No expert attachments found for this case." });

    return res.status(200).json({
      message: "Expert attachments retrieved successfully",
      data: attachments,
    });
  } catch (error) {
    console.error("Get Expert Attachments Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Approve or return an expert attachment
exports.updateExpertAttachmentStatus = async (req, res) => {
  const userId = req.user?.id;
  const { case_id, attachment_id } = req.params;
  const { document_status } = req.body; // 'approved' or 'returned'

  if (!userId) return res.status(401).json({ error: "You are not logged in" });
  if (!case_id || !attachment_id)
    return res
      .status(400)
      .json({ error: "Case ID and attachment ID are required" });
  if (!["approved", "returned"].includes(document_status))
    return res.status(400).json({
      error: "Invalid document_status. Must be 'approved' or 'returned'.",
    });

  try {
    const attachment = await ExpertAttachment.findOne({
      where: { expert_attachment_id: attachment_id, case_id },
    });

    if (!attachment)
      return res
        .status(404)
        .json({ message: "Attachment not found for this case." });

    // Update status and who updated it
    attachment.document_status = document_status;
    attachment.updated_by = userId;
    await attachment.save();

    return res.status(200).json({
      message: `Attachment ${document_status} successfully.`,
      data: attachment,
    });
  } catch (error) {
    console.error("Update Expert Attachment Status Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

exports.sendAgendaDecission = async (req, res) => {
  const { case_id } = req.params;
  const { interim_decision_id, comment } = req.body;
  const committee_head_id = req.user?.id;

  if (!case_id) return res.status(400).json({ error: "Case ID is required" });
  if (!interim_decision_id)
    return res.status(400).json({ error: "Interim decision ID is required" });
  if (!committee_head_id)
    return res.status(401).json({ error: "User not authenticated" });

  const transaction = await sequelize.transaction();

  try {
    // Verify case exists with lock
    const caseItem = await Case.findOne({
      where: { case_id },
      transaction,
      lock: Sequelize.Transaction.LOCK.UPDATE,
    });

    if (!caseItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Verify status exists before using it
    const status = await StatusWithAgenda.findOne({
      where: { status_id: interim_decision_id },
      transaction,
    });

    if (!status) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Interim decision status not found",
        error: `Status with ID ${interim_decision_id} does not exist`,
      });
    }

    // Checking if review already exists
    const existingReview = await CommitteeMembersReview.findOne({
      where: { case_id, committee_head_id },
      transaction,
    });

    let review;

    if (existingReview) {
      // Check if already updated once
      if (existingReview.updated_once === true) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: "Decision has already been submitted and cannot be changed",
        });
      }

      // Update existing review
      await existingReview.update(
        {
          interim_decision_id,
          comment: comment || null,
          updated_once: true,
          reviewed_at: new Date(),
        },
        { transaction }
      );

      review = existingReview;
    } else {
      // Create new review
      review = await CommitteeMembersReview.create(
        {
          case_id,
          committee_head_id,
          interim_decision_id,
          comment: comment || null,
          updated_once: false,
          reviewed_at: new Date(),
        },
        { transaction }
      );
    }

    await Case.update(
      {
        status: "committe decided",
        committee_priority: null,
      },
      {
        where: { case_id },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Agenda decision submitted successfully",
      data: review,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Send agenda decision error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getAgendaDecission = async (req, res) => {
  try {
    const { case_id } = req.params;
    const committee_head_id = req.user?.id;

    if (!case_id) {
      return res.status(400).json({
        success: false,
        message: "case_id is required",
      });
    }

    if (!committee_head_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Fetch the agenda decision from committee_members_reviews table
    const review = await sequelize.query(
      `SELECT 
        cmr.committe_members_review_id,
        cmr.case_id,
        cmr.committee_head_id,
        cmr.interim_decision_id,
        cmr.comment,
        cmr.updated_once,
        cmr.reviewed_at,
        cmr.created_at,
        cmr.updated_at,
        swa.status_id,
        swa.name as status_name,
        swa.description as status_description,
        swa.agenda_id,
        a.agenda_id as agenda_agenda_id,
        a.name as agenda_name,
        a.description as agenda_description
      FROM committee_members_reviews cmr
      LEFT JOIN status_with_agendas swa ON cmr.interim_decision_id = swa.status_id
      LEFT JOIN agendas a ON swa.agenda_id = a.agenda_id
      WHERE cmr.case_id = :case_id AND cmr.committee_head_id = :committee_head_id
      ORDER BY cmr.created_at DESC
      LIMIT 1`,
      {
        replacements: { case_id, committee_head_id },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!review || review.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No agenda decision found",
        data: null,
      });
    }

    const decisionData = review[0];

    res.status(200).json({
      success: true,
      message: "Agenda decision retrieved successfully",
      data: {
        committe_members_review_id: decisionData.committe_members_review_id,
        case_id: decisionData.case_id,
        committee_head_id: decisionData.committee_head_id,
        interim_decision_id: decisionData.interim_decision_id,
        comment: decisionData.comment,
        updated_once: decisionData.updated_once,
        reviewed_at: decisionData.reviewed_at,
        created_at: decisionData.created_at,
        updated_at: decisionData.updated_at,
        status: {
          status_id: decisionData.status_id,
          name: decisionData.status_name,
          description: decisionData.status_description,
          agenda_id: decisionData.agenda_id,
        },
        agenda: {
          agenda_id: decisionData.agenda_agenda_id,
          name: decisionData.agenda_name,
          description: decisionData.agenda_description,
        },
      },
    });
  } catch (error) {
    console.error("Get agenda decision error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving agenda decision",
      error: error.message,
    });
  }
};

exports.getStatusAgendaDecision = async (req, res) => {
  const { status_id } = req.params; // Extract case_id from params
  const { comment } = req.body;
  const committee_head_id = req.user?.id;

  if (!status_id)
    return res.status(400).json({
      success: false,
      error: "Status ID is required",
    });
  if (!committee_head_id)
    return res.status(401).json({
      success: false,
      error: "User not authenticated",
    });

  try {
    const status = await StatusWithAgenda.findOne({
      where: { status_id },
      include: { agenda: true },
    });

    if (!status) {
      return res.status(404).json({
        success: false,
        error: "Status not found",
      });
    }

    // Check if committee head has permission (if needed)
    // if (caseHeadCommitte.assigned_committee !== committee_head_id) {
    //   return res.status(403).json({
    //     success: false,
    //     error: "You are not the committee head of this case"
    //   });
    // }

    // TODO: Actually retrieve the decision from database if it exists
    // For now, return the status and agenda information
    return res.status(200).json({
      success: true,
      message: "Status agenda decision retrieved successfully",
      data: {
        status_id,
        status: {
          status_id: status.status_id,
          name: status.name,
          description: status.description,
          agenda_id: status.agenda_id,
        },
        agenda: status.agenda
          ? {
              agenda_id: status.agenda.agenda_id,
              name: status.agenda.name,
              description: status.agenda.description,
            }
          : null,
        comment: comment || null,
      },
    });
  } catch (error) {
    console.error("Get Status Agenda Decision Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getCommitteeHeadReview = async (req, res) => {
  try {
    const { case_id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }
    const user = await User.findByPk(userId);
    

    if (!case_id) {
      return res.status(400).json({
        success: false,
        error: "Case ID is required",
      });
    }

    // Fetch review for this case regardless of which authenticated user is viewing it.
    // This allows committee heads, committee members, experts, and common departments
    // (who have access to this endpoint via permissions) to see the same decision.
    const review = await CommitteeMembersReview.findOne({
      where: { case_id },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found",
      });
    }

    // Fetch the status with agenda using the correct field name (status_id, not id)
    const statusAgenda = await StatusWithAgenda.findOne({
      where: { status_id: review.interim_decision_id },
      include: [{ association: "agenda" }], // Use association name properly
    });

    if (!statusAgenda) {
      return res.status(200).json({
        review,
        statusAgenda: null,
        message: "Review found but status agenda not found",
      });
    }
    const caseRecord = await Case.findOne({ where: { case_id } });

    const disciplinaryComplaint = await DisciplinaryComplaint.findOne({ where: { disciplinary_complaint_id: caseRecord.disciplinary_complaint_id } });
    
    // User is authorized if they are:
    // 1. In the assigned committee department, OR
    // 2. The director assigned to this complaint, OR
    // 3. The file organizer (get_user_id) assigned to this complaint

    const recordCase = await Case.findOne({ where: { case_id } });

    let isInAssignedCommittee = false;
    let isDirector = false;
    let isFileOrganizer = false;
    let isdisciplinaryGetUser = false;

    if (user.department_id && (user.department_id === caseRecord.assigned_committee)) {
      isInAssignedCommittee = true;
    }
    if (disciplinaryComplaint.director_user_id) {
      isDirector = disciplinaryComplaint.director_user_id === userId ? true : false;
    }
    if (recordCase.get_fileorganizer_id) {
      isFileOrganizer = recordCase.get_fileorganizer_id === userId ? true : false;
    }
    if (disciplinaryComplaint.get_user_id) {
      isdisciplinaryGetUser = disciplinaryComplaint.get_user_id === userId ? true : false;
    }
    
    if (!isInAssignedCommittee && !isDirector && !isFileOrganizer && !isdisciplinaryGetUser) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to view this review",
      });
    }

    return res.status(200).json({
      review,
      statusAgenda,
    });
  } catch (error) {
    console.error("Get Committee Head Review Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getStatusWithAgenda = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }
    const statuses = await StatusWithAgenda.findAll({ where: { type } });
    return res.status(200).json(statuses);
  } catch (error) {
    console.error("Get Status With Agenda Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};
