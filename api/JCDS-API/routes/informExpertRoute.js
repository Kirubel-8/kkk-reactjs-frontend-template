const express = require("express");
const router = express.Router();
const {
  getSelectedCases,
  attachFilesToSelectedCase,
  selectCaseAndInformExperts,
  getAssignedCases,
  getAssignedCaseDetail,
  updateCaseStatusAndPriority,
  getExpertAttachmentsByCase,
  updateExpertAttachmentStatus,
  getUserNotifications,
  markAllAsRead,
  markNotificationAsRead,
  sendAgendaDecission,
  getAgendaDecission,
  getStatusAgendaDecision,
  getCommitteeHeadReview,
  getStatusWithAgenda,
  assignCaseType,
  getCaseTypes,
} = require("../controllers/caseSelectionAndInformExpertController");

const { verifyToken } = require("../middleware/authMiddleware");
const uploadExpertDocuments = require("../middleware/expertAttachmentMiddleware");
const {
  serveExpertDocument,
} = require("../middleware/expertDocumentMiddleware"); // Import the new middleware
const { authorizePermission } = require("../middleware/permissionMiddleware");

// Case assignment and selection routes
router.get("/assigned-cases", verifyToken, getAssignedCases);
router.get("/assigned-cases/:id", verifyToken, getAssignedCaseDetail);
router.patch(
  "/cases/:case_id/select-and-inform",
  verifyToken,
  selectCaseAndInformExperts
);
router.get("/case-types", verifyToken, getCaseTypes);
router.patch("/:case_id/assign-type", verifyToken, assignCaseType);
// File attachment routes
router.post(
  "/cases/:case_id/attach-files",
  verifyToken,
  uploadExpertDocuments.array("files", 10),
  attachFilesToSelectedCase
);

// Case management routes
router.get("/selected-cases", verifyToken, getSelectedCases);
router.patch(
  "/cases/:id/status-priority",
  verifyToken,
  updateCaseStatusAndPriority
);

// Expert attachment management routes
router.get(
  "/cases/:case_id/expert-attachments",
  verifyToken,
  getExpertAttachmentsByCase
);
router.patch(
  "/cases/:case_id/expert-attachments/:attachment_id",
  verifyToken,
  updateExpertAttachmentStatus
);

// File serving route -
router.get("/expert-documents/:filename", serveExpertDocument);
//here users notification
router.get("/my-notifications", verifyToken, getUserNotifications);

// mark all as read go here
router.patch("/my-notifications/mark-all-read", verifyToken, markAllAsRead);
// here mark single notification as read
router.patch("/notifications/:id/read", verifyToken, markNotificationAsRead);

//commite head decision
router.post(
  "/send-agenda-decission/:case_id",
  verifyToken,
  sendAgendaDecission
);
router.get(
  "/get-agenda-decission/:status_id",
  verifyToken,
  getStatusAgendaDecision
);
router.get("/committe-review/:case_id", verifyToken, getCommitteeHeadReview);
router.get(
  "/status-with-agenda",
  verifyToken,
  authorizePermission("DepartmentCommittee", "attach_head_file"),
  getStatusWithAgenda
);
module.exports = router;
