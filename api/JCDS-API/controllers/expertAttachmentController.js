const {
  sequelize,
  Case,
  ExpertAttachment,
  Notification,
  Log,
  User,
  Department,
  CaseType,
  StatusWithAgenda,
  Sequelize
} = require("../models");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");




exports.submitExpertAttachment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { caseId } = req.params;
    const expertId = req.user?.id;
    const { headId, departmentId, description } = req.body; // manually passed for now
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    if (!expertId || !departmentId || !headId) {
      return res.status(400).json({
        success: false,
        message: "expertId, headId, and departmentId are required",
      });
    }

    // ✅ Verify the case exists and belongs to expert’s department
    const caseItem = await Case.findOne({
      where: {
        case_id: caseId,
        status: "assigned to committee",
        assigned_committee: departmentId,
      },
      include: [
        {
          model: Department,
          as: "assigned_committee_ref",
          attributes: ["department_id", "name"],
        },
      ],
    });

    if (!caseItem) {
      // Clean up uploaded files if case not found
      for (const file of files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }

      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to your department",
      });
    }

    // ✅ Create Expert Attachment records
    const attachments = await Promise.all(
      files.map((file) =>
        ExpertAttachment.create(
          {
            expert_attachment_id: uuidv4(),
            case_id: caseId,
            document_name: file.originalname,
            document_path: file.path,
            document_status: "pending",
            description,
            uploaded_by: expertId,
          },
          { transaction }
        )
      )
    );

    // ✅ Update case status
    await Case.update(
      {
        status: "under_committee_review",
        updatedAt: new Date(),
      },
      {
        where: { case_id: caseId },
        transaction,
      }
    );

    // ✅ Notify committee head
    // await Notification.create(
    //   {
    //     notification_id: uuidv4(),
    //     case_id: caseId,
    //     recipient_user_id: headId,
    //     sender_id: expertId,
    //     type: "system",
    //     title: "Expert Submission Complete",
    //     message: `Expert has submitted attachments for case ${caseItem.case_number}.`,
    //     is_read: false,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   },
    //   { transaction }
    // );

    // Create notifications for all committee members
    try {
      // Get all users in the assigned department (committee members)
      const committeeMembers = await User.findAll({
        where: {
          department_id: assignedDepartment.department_id,
        },
        attributes: ['user_id'],
        transaction: t,
      });

      console.log(`[assignToCommittee] Found ${committeeMembers.length} committee members in department ${assignedDepartment.name}`);

      // Create notification for each committee member
      const committeeNotifications = await Promise.all(
        committeeMembers.map((member) =>
          Notification.create({
            notification_id: uuidv4(),
            case_id: newCase.case_id,
            complaint_id: complaint.disciplinary_complaint_id,
            recipient_user_id: member.user_id,
            sender_id: expertId,
            type: "system",
            title: "Expert Reviewed Case",
            message: `The complaint case (${caseItem.case_number}) has been reviewed by expert. Case ID: ${caseItem.case_id}`,
            is_read: false,
          }, { transaction})
        )
      );

      console.log(`[assignToCommittee] Created ${committeeNotifications.length} notifications for committee members`);
    } catch (committeeNotifyErr) {
      // Do not fail the whole flow if committee notification fails
      console.error("Failed to create committee member notifications:", committeeNotifyErr);
    }

    // ✅ Log the action
    await Log.create(
      {
        log_id: uuidv4(),
        case_id: caseId,
        user_log_id: expertId,
        action: "EXPERT_ATTACHMENT_SUBMITTED",
        description: `Expert submitted ${files.length} attachments for case ${caseItem.case_number}`,
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Expert attachments submitted successfully",
      data: {
        attachments: attachments.map((att) => ({
          expert_attachment_id: att.expert_attachment_id,
          document_name: att.document_name,
          document_status: att.document_status,
        })),
        caseStatus: "under_committee_review",
      },
    });
  } catch (error) {
    await transaction.rollback();

    // Clean up files if error
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    console.error("Expert attachment submission error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting expert attachments",
      error: error.message,
    });
  }
};


