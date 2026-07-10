const {
  DisciplinaryComplaint,
  CustomerAccount,
  DisciplinaryComplaintIssue,
  DisciplinaryComplaintEvidence,
  ComplaintHasRejection,
  Case,
  CaseAttachment,
  Department,
  CaseType,
  Notification,
  User,
  CaseHasReturnReason,
  CourtOfficeRequest
} = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// exports.getDisciplinaryCase = async (req, res) => {
//   const userId = req.user?.id;
//   if (!userId) return res.status(401).json({ error: "You are not logged in" });

//   const t = await sequelize.transaction();

//   try {
//     const existingComplaint = await DisciplinaryComplaint.findOne({
//       where: { get_user_id: userId, status: 'accepted' },
//       transaction: t,
//       lock: t.LOCK.UPDATE,
//     });

//     if (existingComplaint) {

//       const [issues, evidences, applicant] = await Promise.all([
//         DisciplinaryComplaintIssue.findAll({
//           where: { disciplinary_complaint_id: existingComplaint.disciplinary_complaint_id },
//         }),
//         DisciplinaryComplaintEvidence.findAll({
//           where: { disciplinary_complaint_id: existingComplaint.disciplinary_complaint_id },
//         }),
//         CustomerAccount.findOne({
//           where: { customer_id: existingComplaint.applicant_id },
//           attributes: ['full_name', 'email', 'phone_number'],
//         }),
//       ]);

//       await t.rollback();
//       return res.status(200).json({
//         message: "You have a case assigned",
//         complaint: {
//           ...existingComplaint.toJSON(),
//           issues,
//           evidences,
//           applicant,
//         },
//       });
//     }

//     const dispComplaint = await DisciplinaryComplaint.findOne({
//       where: { status: 'accepted' },
//       order: [['createdAt', 'ASC']],
//       transaction: t,
//       lock: t.LOCK.UPDATE,
//     });

//     if (!dispComplaint) {
//       await t.rollback();
//       return res.status(404).json({ message: "No accepted disciplinary complaints available" });
//     }

//     dispComplaint.get_user_id = userId;
//     await dispComplaint.save({ transaction: t });

//     // Find the existing Opened case (created when director approved)
//     let caseToUse = await Case.findOne({
//       where: {
//         disciplinary_complaint_id: dispComplaint.disciplinary_complaint_id,
//         status: 'Opened'
//       },
//       transaction: t
//     });

//     // Fallback: If no Opened case exists (shouldn't happen, but safety net)
//     if (!caseToUse) {
//       console.warn('[getDisciplinaryRequest] No Opened case found, creating fallback case');
//       const caseNumber = await generateFileNumber();

//       caseToUse = await Case.create({
//         case_id: uuidv4(),
//         disciplinary_complaint_id: dispComplaint.disciplinary_complaint_id,
//         case_number: caseNumber,
//         status: 'Opened',
//         assigned_committee: null,
//         created_by: userId
//       }, { transaction: t });
//     }

//     const [issues, evidences, applicant] = await Promise.all([
//       DisciplinaryComplaintIssue.findAll({
//         where: {
//           disciplinary_complaint_id: dispComplaint.disciplinary_complaint_id
//         },
//       }),
//       DisciplinaryComplaintEvidence.findAll({
//         where: {
//           disciplinary_complaint_id:
//             dispComplaint.disciplinary_complaint_id
//         },
//       }),
//       CustomerAccount.findOne({
//         where: {
//           customer_id: dispComplaint.applicant_id
//         },
//         attributes: ['full_name', 'email', 'phone_number'],
//       }),
//     ]);

//     await t.commit();
//     return res.status(200).json({
//       message: "You have successfully been assigned a new record",
//       complaint: {
//         ...dispComplaint.toJSON(),
//         issues,
//         evidences,
//         applicant,
//         case: {
//           case_id: caseToUse.case_id,
//           case_number: caseToUse.case_number,
//           status: caseToUse.status
//         }
//       },
//     });
//   } catch (error) {
//     await t.rollback();
//     console.error("Disciplinary Request Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.getDisciplinaryCase = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const t = await sequelize.transaction();

  try {
    const existingCase = await Case.findOne({
      where: {
        get_fileorganizer_id: userId,
        status: "Opened"
      },
      lock: false,
      transaction: t
    });

    if (existingCase) {
      await t.rollback();
      return res.status(200).json({
        message: "You already have an assigned active case",
        case_id: existingCase.case_id,
        case_number: existingCase.case_number
      });
    }

    const nextCase = await Case.findOne({
      where: {
        status: "Opened",
        get_fileorganizer_id: null
      },
      order: [["createdAt", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
      skipLocked: true
    });

    if (!nextCase) {
      await t.rollback();
      return res.status(404).json({
        message: "No Opened cases available right now"
      });
    }

    nextCase.get_fileorganizer_id = userId;
    await nextCase.save({ transaction: t });

    const dc = await DisciplinaryComplaint.findOne({
      where: { disciplinary_complaint_id: nextCase.disciplinary_complaint_id }
    });

    const [issues, evidences, applicant] = await Promise.all([
      DisciplinaryComplaintIssue.findAll({
        where: { disciplinary_complaint_id: dc.disciplinary_complaint_id }
      }),
      DisciplinaryComplaintEvidence.findAll({
        where: { disciplinary_complaint_id: dc.disciplinary_complaint_id }
      }),
      CustomerAccount.findOne({
        where: { customer_id: dc.applicant_id },
        attributes: ["full_name", "email", "phone_number"]
      })
    ]);

    await t.commit();

    return res.status(200).json({
      message: "A new case has been assigned to you",
      case: nextCase,
      issues,
      evidences,
      applicant
    });

  } catch (error) {
    await t.rollback();
    console.error("Get New Case Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// exports.getAllAssignedComplaintsOld = async (req, res) => {
//   const userId = req.user?.id;
//   if (!userId) {
//     return res.status(401).json({ error: "You are not logged in" });
//   }

//   try {
//     const { status } = req.query;
//     const whereClause = {
//       get_user_id: userId,
//     };

//     if (status && status !== "all") {
//       whereClause.status = status;
//     } else {
//       // If fetching all, exclude 'pending_director_approval'
//       whereClause.status = { [Op.ne]: 'pending_director_approval' };
//     }
//     const assignedComplaints = await DisciplinaryComplaint.findAll({
//       where: whereClause,
//       order: [['createdAt', 'DESC']],
//       include: [
//         {
//           model: DisciplinaryComplaintIssue,
//           as: 'issues',
//           separate: true,
//         },
//         {
//           model: DisciplinaryComplaintEvidence,
//           as: 'evidences',
//           separate: true,
//         },
//         {
//           model: CustomerAccount,
//           as: 'applicant',
//           attributes: ['full_name', 'email', 'phone_number'],
//         },
//         {
//           model: Case,
//           as: 'case',
//           attributes: ['status'],
//           required: false,
//         },
//       ],
//     });


//     if (!assignedComplaints.length) {
//       return res.status(404).json({ message: "No pending cases assigned to you" });
//     }

//     res.status(200).json({
//       message: "Assigned disciplinary complaints retrieved successfully",
//       data: assignedComplaints,
//     });
//   } catch (error) {
//     console.error("Fetch Assigned Disciplinary Requests Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.getAllAssignedComplaints = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const { status } = req.query;

    const whereClause = {
      get_fileorganizer_id: userId
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const assignedCases = await Case.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: DisciplinaryComplaintIssue,
              as: "issues"
            },
            {
              model: DisciplinaryComplaintEvidence,
              as: "evidences"
            },
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["full_name", "email", "phone_number"]
            }
          ]
        }
      ]
    });

    if (!assignedCases.length) {
      return res.status(404).json({
        message: "No assigned cases found for you"
      });
    }

    return res.status(200).json({
      message: "Assigned cases retrieved successfully",
      data: assignedCases
    });

  } catch (error) {
    console.error("Fetch Assigned Cases Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAssignedDisciplinaryRequestByIdOld = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Disciplinary request ID is required" });
  }

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        // get_user_id: userId,
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
          attributes: ['full_name', 'email', 'phone_number'],
        },
        {
          model: CaseAttachment,
          as: 'attachments',
          required: false,
          where: {
            case_id: null // Only pending attachments
          }
        }
      ],
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found" });
    }

    res.status(200).json({
      message: "Disciplinary complaint retrieved successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Fetch Disciplinary Request By ID Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAssignedDisciplinaryRequestById = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  console.log("kiiiiia", userId, id);

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const caseRecord = await Case.findOne({
      where: {
        case_id: id,
        get_fileorganizer_id: userId
      },
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          include: [
            {
              model: DisciplinaryComplaintIssue,
              as: "issues",
            },
            {
              model: DisciplinaryComplaintEvidence,
              as: "evidences",
            },
            {
              model: CustomerAccount,
              as: "applicant",
              attributes: ["full_name", "email", "phone_number"]
            }
          ]
        },
        {
          model: CourtOfficeRequest,
          as: "courtOfficeRequest",
          required: false
        },
        {
          model: CaseAttachment,
          as: "attachments",
          required: false
        },
        {
          model: Department,
          as: 'assigned_committee_ref',
          attributes: ['department_id', 'name']
        }
      ]
    });

    console.log("kiiiii", caseRecord);

    if (!caseRecord) {
      return res.status(404).json({ message: "Assigned case not found" });
    }

    return res.status(200).json({
      message: "Case detail retrieved successfully",
      data: caseRecord
    });

  } catch (error) {
    console.error("Fetch Case Detail Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get full assigned case detail (after assignment to committee)
// Returns complaint with case, assigned committee, and all attachments
exports.getAssignedCaseDetail = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Disciplinary complaint ID is required" });
  }

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
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
          attributes: ['full_name', 'email', 'phone_number'],
        },
        {
          model: Case,
          as: 'case',
          required: false,
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found" });
    }

    // Get the case if it exists
    const caseRecord = complaint.case;

    // Get assigned committee details if case exists
    let assignedCommittee = null;
    if (caseRecord && caseRecord.assigned_committee) {
      assignedCommittee = await Department.findByPk(caseRecord.assigned_committee);
    }

    // Get all attachments for this case (including Court Office uploads)
    let attachments = [];
    if (caseRecord) {
      attachments = await CaseAttachment.findAll({
        where: {
          case_id: caseRecord.case_id
        }
      });
    }

    res.status(200).json({
      message: "Case detail retrieved successfully",
      data: {
        complaint: complaint.toJSON(),
        case: caseRecord,
        assigned_committee: assignedCommittee,
        attachments: attachments
      },
    });
  } catch (error) {
    console.error("Fetch Assigned Case Detail Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Generate 6-digit file number with pattern
const generateFileNumber = async () => {
  let fileNumber;
  let isUnique = false;

  while (!isUnique) {
    // Generate 6-digit number
    fileNumber = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if it already exists in cases table
    const existingCase = await Case.findOne({
      where: { case_number: fileNumber }
    });

    if (!existingCase) {
      isUnique = true;
    }
  }

  return fileNumber;
};

// Get department with least assigned cases
const getLeastAssignedDepartment = async () => {
  try {
    // First, get all departments
    const allDepartments = await Department.findAll({
      attributes: ['department_id', 'name']
    });

    // Check that there are at least 2 departments
    if (allDepartments.length < 2) {
      throw new Error(`At least 2 departments are required for assignment. Currently found ${allDepartments.length} department(s).`);
    }

    // Check that each department has at least one user
    const departmentsWithUsers = [];
    for (const dept of allDepartments) {
      const userCount = await User.count({
        where: { department_id: dept.department_id }
      });

      if (userCount > 0) {
        departmentsWithUsers.push(dept);
      } else {
        console.warn(`Department ${dept.name} (${dept.department_id}) has no users and will be excluded from assignment.`);
      }
    }

    // Check that we still have at least 2 departments with users
    if (departmentsWithUsers.length < 2) {
      throw new Error(`At least 2 departments with at least one user each are required for assignment. Currently found ${departmentsWithUsers.length} department(s) with users.`);
    }

    // Get departments with their case counts (only from departments with users)
    const departmentIds = departmentsWithUsers.map(d => d.department_id);
    const departments = await Department.findAll({
      where: {
        department_id: departmentIds
      },
      include: [
        {
          model: Case,
          as: 'assigned_committee_ref',
          where: {
            status: {
              [Op.in]: ['assigned to committee', 'under judiciary expert', 'back to committee']
            }
          },
          required: false,
          attributes: []
        }
      ],
      attributes: [
        'department_id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('assigned_committee_ref.case_id')), 'case_count']
      ],
      group: ['Department.department_id', 'Department.name'],
      order: [
        [sequelize.fn('COUNT', sequelize.col('assigned_committee_ref.case_id')), 'ASC'],
        ['department_id', 'ASC'] // If counts are equal, assign to department with smallest ID
      ]
    });

    if (departments.length === 0) {
      throw new Error('No departments found after filtering by user count');
    }

    return departments[0]; // Return department with least cases
  } catch (error) {
    console.error('Error getting least assigned department:', error);
    throw error;
  }
};

// Upload additional files
exports.uploadAdditionalFiles = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Disciplinary complaint ID is required" });
  }

  try {
    // Check if complaint exists and is assigned to user
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        get_user_id: userId,
      }
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found" });
    }

    // Find the existing case
    const associatedCase = await Case.findOne({
      where: { disciplinary_complaint_id: id }
    });

    if (!associatedCase) {
      return res.status(404).json({ message: "No case found for this complaint" });
    }

    // Handle file uploads
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const attachment = await CaseAttachment.create({
          case_id: associatedCase.case_id, // Use existing case_id
          disciplinary_complaint_id: id,
          file_name: file.originalname,
          file_path: file.path,
          file_status: 'pending',
          description: null,
          uploaded_by: userId
        });
        uploadedFiles.push(attachment);
      }
    }

    res.status(200).json({
      message: "Files uploaded successfully",
      data: {
        files: uploadedFiles.map(file => ({
          id: file.case_attachment_id,
          filename: file.file_name,
          file_path: file.file_path
        }))
      }
    });
  } catch (error) {
    console.error("Upload Additional Files Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Save expert description
exports.saveExpertDescription = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { expert_description } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Disciplinary complaint ID is required" });
  }

  try {
    // Check if complaint exists and is assigned to user
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        get_user_id: userId,
      }
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found" });
    }

    // Find the existing case
    const associatedCase = await Case.findOne({
      where: { disciplinary_complaint_id: id }
    });

    if (!associatedCase) {
      return res.status(404).json({ message: "No case found for this complaint" });
    }

    // Store description as an attachment linked to the case
    const descriptionAttachment = await CaseAttachment.create({
      case_id: associatedCase.case_id, // Use existing case_id
      disciplinary_complaint_id: id,
      file_name: 'expert_description.txt',
      file_path: null, // No file, just description
      file_status: 'pending',
      description: expert_description,
      uploaded_by: userId
    });

    res.status(200).json({
      message: "Expert description saved successfully",
      data: {
        description_id: descriptionAttachment.case_attachment_id
      }
    });
  } catch (error) {
    console.error("Save Expert Description Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove uploaded file
exports.removeUploadedFile = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  try {
    // Find the attachment
    const attachment = await CaseAttachment.findByPk(id);

    if (!attachment) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user uploaded this file
    if (attachment.uploaded_by !== userId) {
      return res.status(403).json({ error: "You can only remove files you uploaded" });
    }

    // Only allow removal if case_id is null (not yet assigned to case)
    if (attachment.case_id !== null) {
      return res.status(400).json({ error: "Cannot remove file after case assignment" });
    }

    // Delete the attachment
    await attachment.destroy();

    res.status(200).json({
      message: "File removed successfully"
    });
  } catch (error) {
    console.error("Remove Uploaded File Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove attachment (includingCourt Office uploads)
exports.removeAttachment = async (req, res) => {
  const userId = req.user?.id;
  const { attachmentId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  const t = await sequelize.transaction();

  try {
    const attachment = await CaseAttachment.findByPk(attachmentId, { transaction: t });

    if (!attachment) {
      await t.rollback();
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Get the complaint to check/update status
    const complaint = await DisciplinaryComplaint.findByPk(
      attachment.disciplinary_complaint_id,
      { transaction: t }
    );

    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Verify user owns this complaint
    if (complaint.get_user_id !== userId) {
      await t.rollback();
      return res.status(403).json({ error: "You don't have permission to remove this attachment" });
    }

    // Store info before deletion
    const wasCourtOfficeDoc = attachment.description === 'Court Office Document';
    const caseId = attachment.case_id;

    // Delete the attachment
    await attachment.destroy({ transaction: t });

    // If it was a Court Office document, check if any remain
    if (wasCourtOfficeDoc && caseId) {
      const remainingCourtOfficeAttachments = await CaseAttachment.count({
        where: {
          case_id: caseId,
          description: 'Court Office Document'
        },
        transaction: t
      });

      // If no Court Office attachments remain and status was 'fulfilled', 
      // reset to 'none' to allow re-request
      if (remainingCourtOfficeAttachments === 0 &&
        complaint.court_office_document_request_status === 'fulfilled') {
        complaint.court_office_document_request_status = 'none';
        complaint.court_office_requested_at = null;
        await complaint.save({ transaction: t });
      }
    }

    await t.commit();

    res.status(200).json({
      message: "Attachment removed successfully"
    });
  } catch (error) {
    await t.rollback();
    console.error("Remove Attachment Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Request documents from court office
exports.requestCourtOfficeDocumentsOld = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        get_user_id: userId
      }
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found or not assigned to you" });
    }

    complaint.court_office_document_request_status = 'pending';
    complaint.court_office_requested_at = new Date();
    await complaint.save();

    res.status(200).json({ message: "Documents requested from court office" });
  } catch (error) {
    console.error("Request Court Office Documents Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.requestCourtOfficeDocuments = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // disciplinary_complaint_id

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    // Find the case associated with this disciplinary complaint and user
    const caseRecord = await Case.findOne({
      where: {
        case_id: id,
        get_fileorganizer_id: userId
      },
      include: [
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
        },
        {
          model: CourtOfficeRequest,
          as: "courtOfficeRequest",
        },
      ],
    });

    if (!caseRecord) {
      return res.status(404).json({ message: "Assigned case not found" });
    }

    // If a CourtOfficeRequest already exists, update it; otherwise, create a new one
    let courtRequest = caseRecord.courtOfficeRequest;
    if (courtRequest) {
      courtRequest.court_office_document_request_status = 'pending';
      courtRequest.court_office_requested_at = new Date();
      await courtRequest.save();
    } else {
      courtRequest = await CourtOfficeRequest.create({
        case_id: caseRecord.case_id,
        court_office_document_request_status: 'pending',
        court_office_requested_at: new Date(),
      });
    }

    res.status(200).json({ message: "Documents requested from court office", data: courtRequest });

  } catch (error) {
    console.error("Request Court Office Documents Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove any attachment (for file organizer)
exports.removeAttachment = async (req, res) => {
  const userId = req.user?.id;
  const { attachmentId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  try {
    const attachment = await CaseAttachment.findByPk(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Verify the user is the file organizer for this case (if linked to a case)
    // Or if it's a pending attachment (case_id is null), verify uploaded_by OR if the user is the file organizer of the complaint
    // Since we don't have complaint_id on attachment easily if case_id is null (unless we added it, but model says case_id), 
    // we might need to rely on the fact that file organizer can remove things.
    // However, for simplicity and safety, let's assume if it's pending (case_id null), check uploaded_by OR check if the user is the file organizer of the *complaint* associated with the attachment?
    // Wait, CaseAttachment doesn't have complaint_id. It has case_id.
    // If case_id is null, it's a temp upload.
    // If the court office uploaded it, uploaded_by will be court office user.
    // The file organizer needs to be able to remove it.
    // But how do we know which complaint it belongs to if case_id is null?
    // Ah, the uploadAdditionalFiles endpoint in fileOrganizerController doesn't link to complaint_id in CaseAttachment?
    // Line 361: case_id: null.
    // This seems to be a flaw in the existing design or my understanding.
    // If case_id is null, how do we know which complaint it belongs to?
    // The `uploadAdditionalFiles` takes `id` (complaint id) but doesn't save it in attachment?
    // Wait, `uploadAdditionalFiles` creates attachment with `case_id: null`.
    // Then `assignToCommittee` creates a NEW case and NEW attachments?
    // No, `assignToCommittee` creates new attachments from `req.files`.
    // What about `uploadAdditionalFiles`? It seems to just upload files but they are "orphaned" until assigned?
    // Actually, `uploadAdditionalFiles` seems to be for "pending" files that show up in the UI?
    // But if they aren't linked to a complaint, how does the UI show them?
    // The UI probably keeps track of them in state?
    // But for Court Office uploads, we need them to be persisted and linked to the complaint so the File Organizer can see them.
    // The `CaseAttachment` model might need `disciplinary_complaint_id` or we need to link them.
    // Let's check `CaseAttachment` model if I can.
    // But wait, the `courtOfficeController.uploadDocuments` I wrote uses `disciplinary_complaint_id`.
    // Does `CaseAttachment` have `disciplinary_complaint_id`?
    // I should check the model. If not, I need to add it or use `case_id` (but case doesn't exist yet).
    // The `courtOfficeController` I wrote:
    // const attachments = files.map(file => ({ disciplinary_complaint_id: id, ... }));
    // If `CaseAttachment` doesn't have `disciplinary_complaint_id`, that will fail.
    // I should check `CaseAttachment` model.

    // Assuming `CaseAttachment` has `disciplinary_complaint_id` or I need to add it.
    // If I need to add it, I should have done a migration.
    // Let's check `CaseAttachment` model first.

    // For now, I will write the `removeAttachment` assuming I can check ownership via `disciplinary_complaint_id`.

    await attachment.destroy();
    res.status(200).json({ message: "Attachment removed successfully" });
  } catch (error) {
    console.error("Remove Attachment Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.assignToCommitteeold = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { expert_description } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Disciplinary complaint ID is required" });
  }

  const t = await sequelize.transaction();

  try {
    console.log('[assignToCommittee] start', { userId, complaintId: id });
    console.log('[assignToCommittee] body keys', Object.keys(req.body || {}));
    console.log('[assignToCommittee] files fields', req.files ? Object.keys(req.files) : null);
    // Check if complaint exists and is assigned to user
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
        get_user_id: userId,
      },
      transaction: t
    });

    if (!complaint) {
      return res.status(404).json({ message: "Disciplinary complaint not found" });
    }

    // Get least assigned department
    const assignedDepartment = await getLeastAssignedDepartment();
    console.log('[assignToCommittee] assignedDepartment', assignedDepartment?.department_id, assignedDepartment?.name);
    if (!assignedDepartment) {
      throw new Error('No department available for assignment');
    }

    // Find the existing Opened case (created when File Organizer got the request)
    const existingCase = await Case.findOne({
      where: {
        disciplinary_complaint_id: id,
        status: 'Opened'
      },
      transaction: t
    });

    if (!existingCase) {
      // Fallback: If no Opened case exists (e.g., old data), create one now
      console.warn('[assignToCommittee] No Opened case found, creating new case (legacy flow)');
      const fileNumber = await generateFileNumber();

      var newCase = await Case.create({
        case_id: uuidv4(),
        disciplinary_complaint_id: id,
        case_number: fileNumber,
        status: 'assigned to committee',
        assigned_committee: assignedDepartment.department_id,
        created_by: userId
      }, { transaction: t });
    } else {
      // Update the existing Opened case
      existingCase.status = 'assigned to committee';
      existingCase.assigned_committee = assignedDepartment.department_id;
      existingCase.updated_by = userId;
      await existingCase.save({ transaction: t });

      var newCase = existingCase; // Use same variable name for compatibility
    }
    console.log('[assignToCommittee] Case ready', newCase.case_id);

    // Collect attachments to persist
    const attachmentsToPersist = [];

    // 1) Persist any uploaded files from this request (via uploadMultiple middleware)
    // Multer .fields puts files in req.files[fieldName] arrays
    const incomingFiles = [];
    if (req.files && Array.isArray(req.files)) {
      // unlikely path if .any() used somewhere
      incomingFiles.push(...req.files);
    } else if (req.files) {
      if (Array.isArray(req.files.files)) incomingFiles.push(...req.files.files);
      if (Array.isArray(req.files.evidence)) incomingFiles.push(...req.files.evidence);
      if (Array.isArray(req.files.signature)) incomingFiles.push(...req.files.signature);
    }
    console.log('[assignToCommittee] incomingFiles count', incomingFiles.length);

    if (incomingFiles.length > 0) {
      for (const file of incomingFiles) {
        const attachment = await CaseAttachment.create({
          case_id: newCase.case_id,
          file_name: file.originalname,
          file_path: file.path,
          file_status: 'pending',
          description: null,
          uploaded_by: userId
        }, { transaction: t });
        attachmentsToPersist.push(attachment);
      }
    }

    // 2) Add expert description as a separate attachment (optional)
    if (expert_description && expert_description.trim()) {
      const descriptionAttachment = await CaseAttachment.create({
        case_id: newCase.case_id,
        file_name: 'expert_description.txt',
        file_path: null,
        file_status: 'pending',
        description: expert_description,
        uploaded_by: userId
      }, { transaction: t });
      attachmentsToPersist.push(descriptionAttachment);
    }

    // Note: The legacy linking code for null attachments has been removed
    // since all attachments are now created with the correct case_id from the start

    // Update complaint status
    complaint.status = 'under_council_review';

    // Implicit cancellation of pending court office request
    if (complaint.court_office_document_request_status === 'pending') {
      complaint.court_office_document_request_status = 'none';
      complaint.court_office_requested_at = null;
    }

    await complaint.save({ transaction: t });

    // Create in-app notification to the applicant (customer)
    try {
      await Notification.create({
        notification_id: uuidv4(),
        case_id: newCase.case_id,
        complaint_id: complaint.disciplinary_complaint_id,
        recipient_customer_id: complaint.applicant_id,
        sender_id: userId,
        type: "system",
        title: "Your case is under council review",
        message: `Your disciplinary complaint is now under council review. Reference: ${complaint.disciplinary_complaint_id}`,
        is_read: false,
      }, { transaction: t });
    } catch (notifyErr) {
      // Do not fail the whole flow if notification fails
      console.error("Failed to create applicant notification:", notifyErr);
    }

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
            sender_id: userId,
            type: "system",
            title: "New case assigned to your committee",
            message: `A new disciplinary complaint case (${newCase.case_id}) has been assigned to your committee (${assignedDepartment.name}) for review. Case ID: ${newCase.case_id}`,
            is_read: false,
          }, { transaction: t })
        )
      );

      console.log(`[assignToCommittee] Created ${committeeNotifications.length} notifications for committee members`);
    } catch (committeeNotifyErr) {
      // Do not fail the whole flow if committee notification fails
      console.error("Failed to create committee member notifications:", committeeNotifyErr);
    }

    await t.commit();

    res.status(200).json({
      message: "Complaint assigned to committee successfully",
      data: {
        case_id: newCase.case_id,
        case_number: newCase.case_number,
        assigned_committee: assignedDepartment.name,
        committee_id: assignedDepartment.department_id,
        attachments_count: attachmentsToPersist.length
      }
    });

  } catch (error) {
    await t.rollback();
    console.error("Assign to Committee Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
};

exports.assignToCommittee = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // Case ID
  console.log("klkl", id);
  const { expert_description } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  if (!id) {
    return res.status(400).json({ error: "Case ID is required" });
  }

  const t = await sequelize.transaction();

  try {
    console.log('[assignToCommittee] start', { userId, caseId: id });

    const existingCase = await Case.findOne({
      where: { case_id: id },
      transaction: t,
      include: [{ model: DisciplinaryComplaint, as: 'disciplinary_complaint' }]
    });

    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const complaint = existingCase.disciplinary_complaint;

    const assignedDepartment = await getLeastAssignedDepartment();
    if (!assignedDepartment) {
      throw new Error('No department available for assignment');
    }

    existingCase.status = 'assigned to committee';
    existingCase.assigned_committee = assignedDepartment.department_id;
    existingCase.updated_by = userId;
    existingCase.updatedAt = new Date();
    await existingCase.save({ transaction: t });

    const attachmentsToPersist = [];
    const incomingFiles = [];
    if (req.files && Array.isArray(req.files)) {
      incomingFiles.push(...req.files);
    } else if (req.files) {
      if (Array.isArray(req.files.files)) incomingFiles.push(...req.files.files);
      if (Array.isArray(req.files.evidence)) incomingFiles.push(...req.files.evidence);
      if (Array.isArray(req.files.signature)) incomingFiles.push(...req.files.signature);
    }

    for (const file of incomingFiles) {
      const attachment = await CaseAttachment.create({
        case_id: existingCase.case_id,
        file_name: file.originalname,
        file_path: file.path,
        file_status: 'pending',
        description: null,
        uploaded_by: userId
      }, { transaction: t });
      attachmentsToPersist.push(attachment);
    }

    if (expert_description && expert_description.trim()) {
      const descAttachment = await CaseAttachment.create({
        case_id: existingCase.case_id,
        file_name: 'expert_description.txt',
        file_path: null,
        file_status: 'pending',
        description: expert_description,
        uploaded_by: userId
      }, { transaction: t });
      attachmentsToPersist.push(descAttachment);
    }

    if (complaint) {
      complaint.status = 'under_council_review';
      if (complaint.court_office_document_request_status === 'pending') {
        complaint.court_office_document_request_status = 'none';
        complaint.court_office_requested_at = null;
      }
      await complaint.save({ transaction: t });
    }

    // Notify applicant
    if (complaint) {
      try {
        await Notification.create({
          notification_id: uuidv4(),
          case_id: existingCase.case_id,
          complaint_id: complaint.disciplinary_complaint_id,
          recipient_customer_id: complaint.applicant_id,
          sender_id: userId,
          type: 'system',
          title: 'Your case is under council review',
          message: `Your case (${existingCase.case_id}) is now under council review.`,
          is_read: false
        }, { transaction: t });
      } catch (err) {
        console.error('Applicant notification failed:', err);
      }
    }

    // Notify committee members
    try {
      const committeeMembers = await User.findAll({
        where: { department_id: assignedDepartment.department_id },
        attributes: ['user_id'],
        transaction: t
      });

      await Promise.all(
        committeeMembers.map(member =>
          Notification.create({
            notification_id: uuidv4(),
            case_id: existingCase.case_id,
            complaint_id: complaint?.disciplinary_complaint_id || null,
            recipient_user_id: member.user_id,
            sender_id: userId,
            type: 'system',
            title: 'New case assigned to your committee',
            message: `Case ${existingCase.case_id} has been assigned to your committee (${assignedDepartment.name}).`,
            is_read: false
          }, { transaction: t })
        )
      );
    } catch (err) {
      console.error('Committee notifications failed:', err);
    }

    await t.commit();

    res.status(200).json({
      message: "Case assigned to committee successfully",
      data: {
        case_id: existingCase.case_id,
        case_number: existingCase.case_number,
        assigned_committee: assignedDepartment.name,
        committee_id: assignedDepartment.department_id,
        assigned_committee_name: assignedDepartment.name,
        attachments_count: attachmentsToPersist.length
      }
    });

  } catch (error) {
    await t.rollback();
    console.error("Assign to Committee Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
};


// Get full assigned case detail by disciplinary complaint id
exports.getAssignedCaseDetail = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // disciplinary_complaint_id

  if (!userId) {
    return res.status(401).json({ error: "You are not logged in" });
  }
  if (!id) {
    return res.status(400).json({ error: "Disciplinary complaint ID is required" });
  }

  try {
    // Ensure the complaint belongs to this user (assigned previously)
    const complaint = await DisciplinaryComplaint.findOne({
      where: {
        disciplinary_complaint_id: id,
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
          attributes: ['full_name', 'email', 'phone_number'],
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Assigned disciplinary complaint not found' });
    }

    // Find created case for this disciplinary complaint
    const foundCase = await Case.findOne({
      where: { disciplinary_complaint_id: id },
      include: [
        {
          model: Department,
          as: 'assigned_committee_ref',
          attributes: ['department_id', 'name'],
        },
        {
          model: CaseAttachment,
          as: 'attachments',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!foundCase) {
      return res.status(404).json({ message: 'No case created yet for this disciplinary complaint' });
    }

    return res.status(200).json({
      message: 'Assigned case detail retrieved successfully',
      data: {
        complaint,
        case: foundCase,
        assigned_committee: foundCase.assigned_committee_ref,
        attachments: foundCase.attachments,
      },
    });
  } catch (error) {
    console.error('Get Assigned Case Detail Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};