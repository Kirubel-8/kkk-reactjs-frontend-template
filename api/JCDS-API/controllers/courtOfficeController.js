const {
  DisciplinaryComplaint,
  CaseAttachment,
  User,
  Case,
  sequelize,
  CourtOfficeRequest
} = require("../models");
const { Op } = require("sequelize");

exports.getDocumentRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "pending", search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    const requestWhere = {};

    if (status !== "all") {
      requestWhere.court_office_document_request_status = status;
    }

    if (search) {
      whereClause.case_number = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Case.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CourtOfficeRequest,
          as: "courtOfficeRequest",
          required: true,
          where: requestWhere
        },
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          attributes: ["disciplinary_complaint_id", "file_number", "judge_name","court_office"]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        [{ model: CourtOfficeRequest, as: "courtOfficeRequest" }, "court_office_requested_at", "DESC"]
      ]
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      requests: rows
    });
  } catch (error) {
    console.error("Error fetching document requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Case.findOne({
      where: { case_id: id },
      include: [
        {
          model: CourtOfficeRequest,
          as: "courtOfficeRequest",
          required: false
        },
        {
          model: DisciplinaryComplaint,
          as: "disciplinary_complaint",
          attributes: ["file_number", "judge_name","court_office"]
        },
        {
          model: CaseAttachment,
          as: "attachments",
          required: false
        },
        {
          model: CourtOfficeRequest,
          as: "courtOfficeRequest",
          required: false
        }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.uploadDocuments = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const caseRecord = await Case.findByPk(id, { transaction });

    if (!caseRecord) {
      await transaction.rollback();
      return res.status(404).json({ message: "Case not found" });
    }

    const attachments = files.map((file) => {

      const fileName = file.filename;  
      const correctPath = `\\uploads\\complaints\\court-office\\${fileName}`;

      return {
        case_id: id,
        disciplinary_complaint_id: caseRecord.disciplinary_complaint_id,
        file_name: file.originalname,
        file_path: correctPath,
        file_status: "pending",
        description: "Court Office Document",
        uploaded_by: req.user.id,
      };
    });

    await CaseAttachment.bulkCreate(attachments, { transaction });

    // --- Update Court Office Request ---
    await CourtOfficeRequest.update(
      {
        court_office_document_request_status: "fulfilled",
        court_office_delivered_at: new Date(),
      },
      { where: { case_id: id }, transaction }
    );

    // --- Update Case status ---
    caseRecord.status = "File Dispatched";
    await caseRecord.save({ transaction });

    await transaction.commit();
    res.status(200).json({ message: "Documents uploaded successfully" });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error uploading documents:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.getUploadedDocuments = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const caseRecord = await Case.findByPk(id, {
//       include: [
//         {
//           model: CaseAttachment,
//           as: "attachments",
//           required: false
//         },
//         {
//           model: CourtOfficeRequest,
//           as: "courtOfficeRequest",
//           required: false
//         }
//       ]
//     });

//     if (!caseRecord) {
//       return res.status(404).json({ message: "Case not found" });
//     }

//     return res.status(200).json({
//       message: "Uploaded documents fetched",
//       data: {
//         attachments: caseRecord.attachments,
//         courtOfficeRequest: caseRecord.courtOfficeRequest
//       }
//     });

//   } catch (error) {
//     console.error("Fetch uploaded documents error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


exports.returnEmpty = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const caseRecord = await Case.findByPk(id);

    if (!caseRecord) {
      return res.status(404).json({ message: "Case not found" });
    }

    await CourtOfficeRequest.update(
      {
        court_office_document_request_status: "returned_empty",
        court_office_request_reason: reason,
      },
      { where: { case_id: id }, transaction }
    );

    await transaction.commit();
    res.status(200).json({ message: "Request returned successfully" });

  } catch (error) {
    await transaction.rollback();
    console.error("Error returning request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

