const express = require("express");
const router = express.Router();
const fileOrganizerController = require("../controllers/fileOrganizerController");
const { verifyToken } = require('../middleware/authMiddleware');
const paginationMiddleware = require("../middleware/paginationMiddleware");
const { uploadMultiple } = require('../middleware/disciplinaryFileUploadMiddleware');
const { authorizePermission } = require('../middleware/permissionMiddleware');

router.get(
  "/get-disciplinary-request",
  paginationMiddleware,
  verifyToken,
  authorizePermission('JudiciaryInvestigationDirectorate', 'getDisciplinaryComplaint'),
  fileOrganizerController.getDisciplinaryCase
);
router.get("/assigned-complaints", paginationMiddleware, verifyToken, fileOrganizerController.getAllAssignedComplaints);
router.get("/assigned-complaints/:id", verifyToken, fileOrganizerController.getAssignedDisciplinaryRequestById);

// Single route for file organizer functionality - handles files + description + assignment in one call
router.post(
  "/disciplinary/:id/assign-committee",
  verifyToken,
  authorizePermission('JudiciaryInvestigationDirectorate', 'fileOrganize'),
  uploadMultiple,
  fileOrganizerController.assignToCommittee);

// Fetch full assigned case detail including assigned committee and attachments
router.get("/disciplinary/:id/assigned-detail", verifyToken, fileOrganizerController.getAssignedCaseDetail);

// Request documents from court office
router.post(
  "/disciplinary/:id/request-documents",
  verifyToken,
  authorizePermission('JudiciaryInvestigationDirectorate', 'fileOrganize'),
  fileOrganizerController.requestCourtOfficeDocuments
);

// Remove attachment (court office uploads or own uploads)
router.delete(
  "/attachments/:attachmentId",
  verifyToken,
  authorizePermission('JudiciaryInvestigationDirectorate', 'fileOrganize'),
  fileOrganizerController.removeAttachment
);

module.exports = router