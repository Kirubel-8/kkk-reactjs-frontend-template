const {
  DisciplinaryComplaint,
  CustomerAccount,
  DisciplinaryComplaintIssue,
  DisciplinaryComplaintEvidence,
  ComplaintHasRejection,
  ComplaintWitness,
  Notification,
  Case,
  User,
  CaseHasReturnReason
} = require('../models');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require("sequelize");

exports.getDisciplinaryRequest = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "You are not logged in" });

  const t = await sequelize.transaction();

  try {
    const existingComplaint = await DisciplinaryComplaint.findOne({
      where: { get_user_id: userId, status: 'pending' },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existingComplaint) {
      const [issues, evidences, applicant] = await Promise.all([
        DisciplinaryComplaintIssue.findAll({
          where: { disciplinary_complaint_id: existingComplaint.disciplinary_complaint_id },
        }),
        DisciplinaryComplaintEvidence.findAll({
          where: { disciplinary_complaint_id: existingComplaint.disciplinary_complaint_id },
        }),
        {
          model: ComplaintWitness,
          as: 'witnesses',
          attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature'],
        },
        CustomerAccount.findOne({
          where: { customer_id: existingComplaint.applicant_id },
          attributes: ['full_name', 'email', 'phone_number'],
        }),
      ]);

      await t.rollback();
      return res.status(200).json({
        message: "You have a pending case assigned",
        complaint: {
          ...existingComplaint.toJSON(),
          issues,
          evidences,
          applicant,
        },
      });
    }

    const dispComplaint = await DisciplinaryComplaint.findOne({
      where: { get_user_id: null, status: 'pending' },
      order: [['createdAt', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!dispComplaint) {
      await t.rollback();
      return res.status(404).json({ message: "No pending disciplinary complaints available" });
    }

    if (dispComplaint.get_user_id != null) {
      await t.rollback();
      return res.status(404).json({ message: "you already assigned" });
    }

    dispComplaint.get_user_id = userId;
    dispComplaint.status = "under_investigation";
    await dispComplaint.save({ transaction: t });

    const [issues, evidences, applicant] = await Promise.all([
      DisciplinaryComplaintIssue.findAll({
        where: {
          disciplinary_complaint_id: dispComplaint.disciplinary_complaint_id
        },
      }),
      DisciplinaryComplaintEvidence.findAll({
        where: {
          disciplinary_complaint_id:
            dispComplaint.disciplinary_complaint_id
        },
      }),
      CustomerAccount.findOne({
        where: {
          customer_id: dispComplaint.applicant_id
        },
        attributes: ['full_name', 'email', 'phone_number'],
      }),
    ]);

    // Create in-app notification to the applicant (customer)
    try {
      await Notification.create({
        notification_id: uuidv4(),
        complaint_id: dispComplaint.disciplinary_complaint_id,
        recipient_customer_id: dispComplaint.applicant_id,
        sender_id: userId,
        type: "system",
        title: "Your case is under investigation",
        message: `Your disciplinary complaint is now under investigation. Reference: ${dispComplaint.disciplinary_complaint_id}`,
        is_read: false,
      }, { transaction: t });
    } catch (notifyErr) {
      // Do not fail the whole flow if notification fails
      console.error("Failed to create applicant notification:", notifyErr);
    }

    await t.commit();

    res.status(200).json({
      message: "Complaint assigned to you",
      dispComplaint: {
        ...dispComplaint.toJSON(),
        issues,
        evidences,
        applicant,
      },
    });

  } catch (error) {
    await t.rollback();
    console.error("Disciplinary Request Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAssignedDisciplinaryRequestsOld = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const { status } = req.query;
    const whereClause = {
      get_user_id: userId,
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }
    const assignedComplaints = await DisciplinaryComplaint.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: DisciplinaryComplaintIssue,
          as: 'issues',
          separate: true,
        },
        {
          model: DisciplinaryComplaintEvidence,
          as: 'evidences',
          separate: true,
        },
        {
          model: CustomerAccount,
          as: 'applicant',
          attributes: ['full_name', 'email', 'phone_number'],
        },
        {
          model: Case,
          as: 'case',
          required: false,
        },
      ],
    });

    console.log("kirub", assignedComplaints);

    if (!assignedComplaints.length) {
      return res.status(404).json({ message: "No pending cases assigned to you" });
    }

    res.status(200).json({
      message: "Assigned disciplinary complaints retrieved successfully",
      data: assignedComplaints,
    });
  } catch (error) {
    console.error("Fetch Assigned Disciplinary Requests Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAssignedDisciplinaryRequests = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const { status } = req.query;

    let whereClause = {};

    if (status === "pending") {
      whereClause.status = "pending";
    } 
    else if (status === "all") {
      whereClause.get_user_id = userId;
    }
    else if (status) {
      whereClause = {
        get_user_id: userId,
        status: status,
      };
    }
    // fallback
    else {
      whereClause.get_user_id = userId;
    }

    const assignedComplaints = await DisciplinaryComplaint.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        { model: DisciplinaryComplaintIssue, as: 'issues', separate: true },
        { model: DisciplinaryComplaintEvidence, as: 'evidences', separate: true },
        { model: CustomerAccount, as: 'applicant', attributes: ['full_name', 'email', 'phone_number'] },
        { model: Case, as: 'case', required: false },
      ],
    });

    if (!assignedComplaints.length) {
      return res.status(404).json({ message: "No complaints found" });
    }

    return res.status(200).json({
      message: "Complaints fetched successfully",
      data: assignedComplaints,
    });

  } catch (error) {
    console.error("Fetch Assigned Disciplinary Requests Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getAssignedDisciplinaryRequestsById = async (req, res) => {
  const userId = req.user?.id;
  const { disp_id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!disp_id) {
    return res.status(400).json({ error: "Disciplinary request ID is required" });
  }

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: disp_id,
        get_user_id: userId,
      },
      include: [
        {
          model: DisciplinaryComplaintIssue,
          as: 'issues',
          separate: true,
        },
        {
          model: DisciplinaryComplaintEvidence,
          as: 'evidences',
          separate: true,
        },
        {
          model: CustomerAccount,
          as: 'applicant',
          attributes: ['full_name', 'email', 'phone_number', 'gender'],
        },
        {
          model: ComplaintWitness,
          as: 'witnesses',
          attributes: ['complaint_witness_id', 'witness_name', 'witness_address', 'witness_phone_number', 'witness_signature'],
        },
        {
          model: ComplaintHasRejection,
          as: "disciplinaryRejection",
          separate: true,
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: User,
              as: "createdByUser",
              attributes: ["full_name", "email"],
            }
          ]
        },        
        {
          model: Case,
          as: 'case',
          required: false,
          include: [
            {
              model: CaseHasReturnReason,
              as: "disciplinaryCaseReturn",
              required: false,
              order: [["createdAt", "DESC"]],
              include: [
                {
                  model: User,
                  as: "createdByUser",
                  attributes: ["full_name", "email"],
                }
              ]
            },
          ]
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found" });
    }
    // Normalize return records to expose user_id (for UI alignment)
    if (complaint.case?.disciplinaryCaseReturn) {
      complaint.case.disciplinaryCaseReturn.forEach((ret) => {
        if (ret && ret.dataValues) {
          ret.dataValues.user_id = ret.created_by || null;
        }
      });
    }
    const rejectionComments = complaint.disciplinaryRejection?.map(r => r.comment);
    console.log("kiryb Rejection Comments:", rejectionComments);

    const latestRejection = complaint.disciplinaryRejection?.[0]?.comment;
    console.log("kiryb Latest Rejection:", latestRejection);

    res.status(200).json({
      message: "Disciplinary complaint retrieved successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Fetch Disciplinary Request By ID Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateEvidenceFileStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "You are not logged in" });
    }

    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const evidence = await DisciplinaryComplaintEvidence.findByPk(id, {
      include: {
        model: DisciplinaryComplaint,
        as: "complaint",
        attributes: ["applicant_id", "disciplinary_complaint_id"],
      },
    });

    console.log("evidence,", evidence);
    if (!evidence) {
      return res.status(404).json({ message: "Evidence not found" });
    }

    evidence.file_status = status;

    if (status === "rejected") {
      evidence.rejection_reason = rejection_reason || "No reason provided";

      const notification = await Notification.create({
        notification_id: uuidv4(),
        complaint_id: evidence.disciplinary_complaint_id,
        recipient_customer_id: evidence.complaint?.applicant_id,
        sender_id: userId,
        type: "system",
        title: "Your evidence is rejected",
        message: `Your evidence is rejected. Reason: ${rejection_reason || "No reason provided"}`,
        is_read: false,
      });

      await evidence.save();

      return res.status(200).json({
        message: `Evidence rejected successfully`,
        data: evidence,
        notification: notification,
      });
    } else {
      evidence.rejection_reason = null;
      await evidence.save();

      return res.status(200).json({
        message: `Evidence verified successfully`,
        data: evidence,
      });
    }
  } catch (err) {
    console.error("Update Evidence File Status Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.processDisciplinaryComplaint = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { action, comment } = req.body;

    const allowedActions = ["accept", "reject", "return"];

    if (!allowedActions.includes(action)) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Invalid action. Must be one of: ${allowedActions.join(", ")}.`
      });
    }

    const complaint = await DisciplinaryComplaint.findByPk(id, {
      include: [
        {
          model: DisciplinaryComplaintEvidence,
          as: "evidences",
        },
      ],
      transaction,
    });

    if (!complaint) {
      await transaction.rollback();
      return res.status(404).json({ message: "Disciplinary complaint not found." });
    }

    const evidences = complaint.evidences || [];

    const counts = evidences.reduce(
      (acc, e) => {
        acc.total += 1;
        if (e.file_status === "verified") acc.verified += 1;
        if (e.file_status === "rejected") acc.rejected += 1;
        if (e.file_status === "pending") acc.pending += 1;
        return acc;
      },
      { total: 0, verified: 0, rejected: 0, pending: 0 }
    );

    if (action === "accept") {
      if (counts.total > 0 && counts.verified !== counts.total) {
        await transaction.rollback();
        return res.status(400).json({
          message: "please verify all documnets to accept the discipline complaint request.",
          details: {
            total: counts.total,
            verified: counts.verified,
            pending: counts.pending,
            rejected: counts.rejected,
          },
        });
      }
      complaint.status = "accepted";
      await complaint.save({ transaction });

      let caseRecord = await Case.findOne({
        where: { disciplinary_complaint_id: id },
        transaction
      });

      if (complaint.director_user_id && caseRecord) {
        caseRecord.status = "pending_director_approval_again";
        await caseRecord.save({ transaction });
      }

      else if (!complaint.director_user_id && !caseRecord) {

      // Generate case number
      const generateFileNumber = async () => {
        let fileNumber;
        let isUnique = false;

        while (!isUnique) {
          fileNumber = Math.floor(100000 + Math.random() * 900000).toString();
          const existingCase = await Case.findOne({
            where: { case_number: fileNumber },
            transaction,
          });

          if (!existingCase) {
            isUnique = true;
          }
        }

        return fileNumber;
      };

      const caseNumber = await generateFileNumber();

      // Create Case record with pending_director_approval status
      caseRecord = await Case.create(
        {
          case_id: uuidv4(),
          disciplinary_complaint_id: id,
          case_number: caseNumber,
          status: "pending_director_approval",
          assigned_committee: null,
          created_by: userId,
        },
        { transaction }
      );
    }

      // Create in-app notification to the applicant (customer)
      try {
        await Notification.create({
          notification_id: uuidv4(),
          complaint_id: complaint.disciplinary_complaint_id,
          recipient_customer_id: complaint.applicant_id,
          sender_id: userId,
          type: "system",
          title: "Your case is pending director review",
          message: `Your disciplinary complaint is now pending judiciary director review. Reference: ${complaint.disciplinary_complaint_id}`,
          is_read: false,
        }, { transaction });
      } catch (notifyErr) {
        // Do not fail the whole flow if notification fails
        console.error("Failed to create applicant notification:", notifyErr);
      }

      await transaction.commit();

      return res.status(200).json({
        message: "Disciplinary Complaint sent to judiciary director for review.",
        data: complaint,
        case: {
          case_id: caseRecord.case_id,
          case_number: caseRecord.case_number,
          status: caseRecord.status,
        },
      });
    }

    if (action === "reject") {
      if (counts.total > 0 && counts.rejected === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Cannot reject — at least one evidence must be rejected.",
          details: {
            total: counts.total,
            verified: counts.verified,
            pending: counts.pending,
            rejected: counts.rejected,
          },
        });
      }
      await ComplaintHasRejection.create(
        {
          disciplinary_complaint_id: id,
          comment: comment || null,
          created_by: userId,
          updated_by: userId,
        },
        { transaction }
      );

      complaint.status = "rejected";
      await complaint.save({ transaction });

      // Create in-app notification to the applicant (customer)

      try {
        await Notification.create({
          notification_id: uuidv4(),
          complaint_id: complaint.disciplinary_complaint_id,
          recipient_customer_id: complaint.applicant_id,
          sender_id: userId,
          type: "system",
          title: "Your case is rejected",
          message: `Your disciplinary complaint has been rejected because you did not provide sufficient evidence. Reference: ${complaint.disciplinary_complaint_id}`,
          is_read: false,
        }, { transaction });
      } catch (notifyErr) {
        // Do not fail the whole flow if notification fails
        console.error("Failed to create applicant notification:", notifyErr);
      }

      await transaction.commit();
      return res.status(200).json({
        message: "Complaint rejected successfully.",
        data: complaint,
      });
    }

    if (action === "return") {
      await ComplaintHasRejection.create(
        {
          disciplinary_complaint_id: id,
          comment: comment || null,
          user_id:userId,
          created_by: userId,
          updated_by: userId,
        },
        { transaction }
      );

      complaint.status = "returned";
      await complaint.save({ transaction });

      // Create in-app notification to the applicant (customer)

      try {
        await Notification.create({
          notification_id: uuidv4(),
          complaint_id: complaint.disciplinary_complaint_id,
          recipient_customer_id: complaint.applicant_id,
          sender_id: userId,
          type: "system",
          title: "Your case is returned",
          message: `Your disciplinary complaint has been returned. Reference: ${complaint.disciplinary_complaint_id}`,
          is_read: false,
        }, { transaction });
      } catch (notifyErr) {
        // Do not fail the whole flow if notification fails
        console.error("Failed to create applicant notification:", notifyErr);
      }

      await transaction.commit();
      return res.status(200).json({
        message: "Complaint returned successfully.",
        data: complaint,
      });
    }
  } catch (err) {
    await transaction.rollback();
    console.error("processDisciplinaryComplaint error:", err);
    return res.status(500).json({ message: err.message || "An unexpected server error occurred. Please try again later.", });
  }
};

exports.getExpiringDisciplinary = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const { status } = req.query;

    // DATE RANGE FILTER
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    const oneYearTenMonthsAgo = new Date(now);
    oneYearTenMonthsAgo.setFullYear(now.getFullYear() - 1);
    oneYearTenMonthsAgo.setMonth(now.getMonth() - 10);

    const whereClause = {
      get_user_id: null,
      createdAt: {
        [Op.between]: [twoYearsAgo, oneYearTenMonthsAgo],
      },
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const tobeExpiryComplaints = await DisciplinaryComplaint.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
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
        {
          model: CustomerAccount,
          as: "applicant",
          attributes: ["full_name", "email", "phone_number"],
        },
      ],
    });

    console.log("kirub1", tobeExpiryComplaints);

    // FLAG EXPIRED CASES
    const updatedComplaints = tobeExpiryComplaints.map((caseItem) => {
      const createdAt = new Date(caseItem.createdAt);
      const diffYears = (now - createdAt) / (1000 * 60 * 60 * 24 * 365);

      return {
        ...caseItem.toJSON(),
        isExpired: diffYears >= 2,          // EXACT EXPIRE
        isNearExpire: diffYears >= 1.83 && diffYears < 2, // 1yr 10mo - 2 yrs
      };
    });

    if (!tobeExpiryComplaints.length) {
      return res.status(404).json({ message: "No pending cases assigned to you" });
    }

    res.status(200).json({
      message: "To be expired disciplinary complaints retrieved successfully",
      data: updatedComplaints,
      expiringCount: updatedComplaints.filter(c => c.isNearExpire || c.isExpired).length
    });
  } catch (error) {
    console.error("Fetch Assigned Disciplinary Requests Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};