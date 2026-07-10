const {
  DisciplinaryComplaint,
  CustomerAccount,
  DisciplinaryComplaintIssue,
  DisciplinaryComplaintEvidence,
  ComplaintHasRejection,
  ComplaintWitness,
  Case,
  sequelize,
  User,
  CaseHasReturnReason,
  Department
} = require("../models");
const { v4: uuidv4 } = require("uuid");

/**
 * Get a case for judiciary director review (get-and-assign pattern)
 * First checks if director already has an assigned case, otherwise assigns oldest pending case
 */
exports.getDirectorRequest = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "You are not logged in" });

  const t = await sequelize.transaction();

  try {
    // Check if user already has a case assigned
    const existingComplaint = await DisciplinaryComplaint.findOne({
      where: { director_user_id: userId },
      include: [
        {
          model: Case,
          as: 'case',
          where: { status: 'pending_director_approval' },
          required: true,
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existingComplaint) {
      const [issues, evidences, witnesses, applicant, rejection] =
        await Promise.all([
          DisciplinaryComplaintIssue.findAll({
            where: {
              disciplinary_complaint_id:
                existingComplaint.disciplinary_complaint_id,
            },
          }),
          DisciplinaryComplaintEvidence.findAll({
            where: {
              disciplinary_complaint_id:
                existingComplaint.disciplinary_complaint_id,
            },
          }),
          ComplaintWitness.findAll({
            where: {
              disciplinary_id: existingComplaint.disciplinary_complaint_id,
            },
          }),
          CustomerAccount.findOne({
            where: { customer_id: existingComplaint.applicant_id },
            attributes: ["full_name", "email", "phone_number"],
          }),
          ComplaintHasRejection.findOne({
            where: {
              disciplinary_complaint_id:
                existingComplaint.disciplinary_complaint_id,
            },
          }),
        ]);

      await t.rollback();
      return res.status(200).json({
        message: "You have a case assigned",
        complaint: {
          ...existingComplaint.toJSON(),
          issues,
          evidences,
          witnesses,
          applicant,
          disciplinaryRejection: rejection,
        },
      });
    }

    // Assign new case
    const nextComplaint = await DisciplinaryComplaint.findOne({
      where: { director_user_id: null },
      include: [
        {
          model: Case,
          as: 'case',
          where: { status: 'pending_director_approval' },
          required: true,
        },
      ],
      order: [["createdAt", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!nextComplaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "No cases pending director approval" });
    }

    nextComplaint.director_user_id = userId;
    await nextComplaint.save({ transaction: t });

    const [issues, evidences, witnesses, applicant, rejection] =
      await Promise.all([
        DisciplinaryComplaintIssue.findAll({
          where: {
            disciplinary_complaint_id: nextComplaint.disciplinary_complaint_id,
          },
        }),
        DisciplinaryComplaintEvidence.findAll({
          where: {
            disciplinary_complaint_id: nextComplaint.disciplinary_complaint_id,
          },
        }),
        ComplaintWitness.findAll({
          where: { disciplinary_id: nextComplaint.disciplinary_complaint_id },
        }),
        CustomerAccount.findOne({
          where: { customer_id: nextComplaint.applicant_id },
          attributes: ["full_name", "email", "phone_number"],
        }),
        ComplaintHasRejection.findOne({
          where: {
            disciplinary_complaint_id: nextComplaint.disciplinary_complaint_id,
          },
        }),
      ]);

    await t.commit();

    res.status(200).json({
      message: "Case assigned to you for review",
      complaint: {
        ...nextComplaint.toJSON(),
        issues,
        evidences,
        witnesses,
        applicant,
        disciplinaryRejection: rejection,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Get Director Request Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all cases assigned to this judiciary director

exports.getAllAssignedCases = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const { case_status } = req.query;
    
    const whereClause = {
      director_user_id: userId,
    };

    const caseInclude = {
      model: Case,
      as: 'case',
      required: false,
      where: {}, // default empty
    };

    console.log("kiry", caseInclude.where.status);

    if (case_status && case_status !== "all") {
      caseInclude.where.status = case_status;
      console.log("kirybss", caseInclude);
      caseInclude.required = true;
    }

    const assignedComplaints = await DisciplinaryComplaint.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        { model: DisciplinaryComplaintIssue, as: "issues", separate: true },
        { model: DisciplinaryComplaintEvidence, as: "evidences", separate: true },
        { model: ComplaintWitness, as: "witnesses", separate: true },
        { model: CustomerAccount, as: "applicant", attributes: ["full_name", "email", "phone_number"] },
        { model: ComplaintHasRejection, as: "disciplinaryRejection", required: false },
        caseInclude,
        // { model: Case, as: "case", required: false },

      ],
    });

    if (!assignedComplaints.length) {
      return res.status(404).json({ message: "No cases assigned to you" });
    }

    res.status(200).json({
      message: "Assigned cases retrieved successfully",
      data: assignedComplaints,
    });
  } catch (error) {
    console.error("Fetch Assigned Cases Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * Get a specific assigned case by ID
 * Verifies the case is assigned to this director
 */
exports.getAssignedCaseById = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Case ID is required" });
  }

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        director_user_id: userId,
      },
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
          model: ComplaintWitness,
          as: "witnesses",
          separate: true,
        },
        {
          model: CustomerAccount,
          as: "applicant",
          attributes: ["full_name", "email", "phone_number"],
        },
        {
          model: Case,
          as: "case",
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
          ]
        },
      ],
    });

    if (!complaint) {
      return res
        .status(404)
        .json({ message: "Case not found or not assigned to you" });
    }

    const rejectionComments = complaint.disciplinaryRejection?.map(r => r.comment);
    console.log("kirybb Rejection Comments:", rejectionComments);

    res.status(200).json({
      message: "Case retrieved successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Fetch Case By ID Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Approve a case - sends it to file organizer
 * Changes status from pending_director_approval to accepted
 */
exports.approveCase = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Case ID is required" });
  }

  const t = await sequelize.transaction();

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        director_user_id: userId,
      },
      include: [
        {
          model: Case,
          as: 'case',
          required: true,
        },
      ],
      transaction: t,
    });

    if (!complaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "Case not found or not assigned to you" });
    }

    const caseRecord = complaint.case;
    if (!caseRecord || (caseRecord.status !== "pending_director_approval" && caseRecord.status !== "pending_director_approval_again")) {
      await t.rollback();
      console.log('case not pending approval', {caseRecord});
      return res.status(400).json({
        message: "Case is not pending director approval",
        currentStatus: caseRecord?.status || 'no case found',
      });
    }

    // Update existing case status from pending_director_approval to Opened
    caseRecord.status = "Opened";
    await caseRecord.save({ transaction: t });

    // Approve: change complaint status to accepted (keep director_user_id for history)
    // complaint.status = "accepted";
    // await complaint.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      message: "Displinary case approved and Case Opend for further investigation",
      complaint,
      case: {
        case_id: caseRecord.case_id,
        case_number: caseRecord.case_number,
        status: caseRecord.status,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Approve Case Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Return a case to previous stage with reason
 * Changes status back to pending and creates rejection record
 */
exports.returnCase = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { reason } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Case ID is required" });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason for return is required" });
  }

  const t = await sequelize.transaction();

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        director_user_id: userId,
      },
      include: [
        {
          model: Case,
          as: 'case',
          required: true,
        },
      ],
      transaction: t,
    });

    if (!complaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "Case not found or not assigned to you" });
    }

    const caseRecord = complaint.case;
    if (!caseRecord || (caseRecord.status !== "pending_director_approval" && caseRecord.status !== "pending_director_approval_again")) {
      await t.rollback();
      return res.status(400).json({
        message: "Case is not pending director approval",
        currentStatus: caseRecord?.status || 'no case found',
      });
    }

    // Create rejection record
    await CaseHasReturnReason.create(
      {
        disciplinary_complaint_id: id,
        case_id: caseRecord.case_id,
        return_reason: reason,
        created_by: userId,
        updated_by: userId,
      },
      { transaction: t }
    );

    caseRecord.status = "Returned by Director";
    await caseRecord.save({ transaction: t });
    await t.commit();

    res.status(200).json({
      message: "Case returned successfully",
      complaint,
    });
  } catch (error) {
    await t.rollback();
    console.error("Return Case Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};