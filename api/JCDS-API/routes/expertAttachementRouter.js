const express = require("express");
const router = express.Router();
// const expertAttachmentController = require("../controllers/expertAttachmentController");
const { validateExpertAttachment } = require("../validators/expertAttachmentValidator");
const { verifyToken } = require('../middleware/authMiddleware');
const uploadExpertDocuments = require("../middleware/expertAttachmentMiddleware");
const {submitExpertAttachment}=require("../controllers/expertAttachmentController");
router.post(
  "/:caseId",
  uploadExpertDocuments.array("files", 10),
  submitExpertAttachment
);

//Get all cases (for experts or admin)

// router.get(
//   "/cases",
//   verifyToken,
//   expertAttachmentController.getAllCases
// );

// Get single case by ID (with all details)

// router.get(
//   "/cases/:id",
//   verifyToken,
//   expertAttachmentController.getCaseById
// );

// Get all expert attachments for a case

// router.get(
//   "/cases/:caseId/attachments",
//   verifyToken,
//   expertAttachmentController.getCaseExpertAttachments
// );

// Committee head updates attachment review status

// router.put(
//   "/attachments/:attachmentId/status",
//   verifyToken,
//   expertAttachmentController.updateAttachmentStatus
// );


module.exports = router;