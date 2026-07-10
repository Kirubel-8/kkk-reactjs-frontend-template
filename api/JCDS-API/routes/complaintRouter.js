const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const {
  validateCreateComplaint,
  validateUpdateComplaint,
} = require("../validators/complaintValidator");
const upload = require("../middleware/multerConfig");
const complaintAttachmentMiddleware = require("../middleware/complaintAttachmentMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizePermission } = require("../middleware/permissionMiddleware");

// Protected routes - must be authenticated
/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Create a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               witnesses:
 *                 description: JSON array string of witnesses [{witness_name,witness_address}]
 *                 type: string
 *               judge_name:
 *                 type: string
 *               judge_court:
 *                 type: string
 *               case_file_number:
 *                 type: string
 *               case_type:
 *                 type: string
 *               act_date:
 *                 type: string
 *                 format: date
 *               detailed_description:
 *                 type: string
 *               damage_description:
 *                 type: string
 *               additional_explanation:
 *                 type: string
 *               witness_signatures:
 *                 type: array
 *                 description: Image files matching the order of witnesses
 *                 items:
 *                   type: string
 *                   format: binary
 *               evidence_files:
 *                 type: array
 *                 description: Evidence attachments (any file type)
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Complaint created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: List complaints for authenticated user
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *       401:
 *         description: Unauthorized
 */

router.get("/get_all_complaint",verifyToken,complaintController.getAllRequestCompliantRequest);
  router.get("/", verifyToken, complaintController.getComplaint);
router.get("/get_complaint_rejection/:complaint_id", verifyToken, complaintController.getComplaintRejection);
router.get("/get_compliant_by_id/:compliant_id", verifyToken, complaintController.getComplaintById);
router.put("/approve_evidence/:complaint_evidence_id", verifyToken,complaintController.approveEvidence);
router.put("/reject_evidence/:complaint_evidence_id", verifyToken,complaintController.rejectEvidence);
router.put("/approve_complaint/:compliant_id", verifyToken,complaintController.approveComplaint);
router.put("/reject_complaint/:compliant_id", verifyToken,complaintController.rejectComplaint);
router.put("/return_complaint/:compliant_id", verifyToken,complaintController.returnComplaint);
router.post("/raise_issue_complaint/:compliant_id", verifyToken,complaintController.raiseIssueComplaint);
router.post(
  "/upload_investigation",
  verifyToken,
  upload,
  complaintController.uploadInvestigation
);
router.put(
  "/case-attachments/:case_attachment_id",
  verifyToken,
  upload,
  complaintController.updateCaseAttachment
);
router.delete(
  "/case-attachments/:case_attachment_id",
  verifyToken,
  complaintController.deleteCaseAttachment
);
router.post(
  "/case-attachments/bulk",
  verifyToken,
  upload,
  complaintController.bulkUpdateAttachments
);
router.patch(
  "/evidence/:complaint_evidence_id/modify",
  verifyToken,
  complaintController.modifyRejectedEvidence
);

// Decision recommendation endpoints (complaintCase - recommendDecision permission)
router.post(
  "/decision-recommendations",
  verifyToken,
  authorizePermission("complaintCase", "recommendDecision"),
  complaintController.createDecisionRecommendation
);
router.get(
  "/decision-recommendations",
  verifyToken,
  authorizePermission("complaintCase", "recommendDecision"),
  complaintController.getDecisionRecommendations
);
router.get(
  "/decision-recommendations/:id",
  verifyToken,
  authorizePermission("complaintCase", "recommendDecision"),
  complaintController.getDecisionRecommendations
);
router.put(
  "/decision-recommendations/:id",
  verifyToken,
  authorizePermission("complaintCase", "recommendDecision"),
  complaintController.updateDecisionRecommendation
);
router.delete(
  "/decision-recommendations/:id",
  verifyToken,
  authorizePermission("complaintCase", "recommendDecision"),
  complaintController.deleteDecisionRecommendation
);


/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Get a complaint by id (owned by the requester)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Complaint with evidences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/complaints/{id}:
 *   put:
 *     summary: Update a complaint by id (owned by the requester)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               judge_name:
 *                 type: string
 *               judge_court:
 *                 type: string
 *               case_file_number:
 *                 type: string
 *               case_type:
 *                 type: string
 *               act_date:
 *                 type: string
 *                 format: date
 *               detailed_description:
 *                 type: string
 *               damage_description:
 *                 type: string
 *               additional_explanation:
 *                 type: string
 *               complainant_address:
 *                 type: string
 *               witnesses:
 *                 description: JSON array string of witnesses; each may include complaint_witness_id to update existing
 *                 type: string
 *               remove_witness_ids:
 *                 description: JSON array string of witness IDs to remove
 *                 type: string
 *               remove_evidence_ids:
 *                 description: JSON array string of evidence IDs to remove
 *                 type: string
 *               witness_signatures:
 *                 type: array
 *                 description: Image files matching index of witnesses array
 *                 items:
 *                   type: string
 *                   format: binary
 *               evidence_files:
 *                 type: array
 *                 description: Evidence attachments (any supported file type)
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Complaint updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/complaints/{id}:
 *   delete:
 *     summary: Delete a complaint by id (owned by the requester)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Complaint deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

router.get("/", verifyToken, complaintController.getComplaint);
router.get("/:id", verifyToken, complaintController.getComplaint);
router.post(
  "/",
  verifyToken,
  upload,
  complaintAttachmentMiddleware,
  validateCreateComplaint,
  complaintController.createComplaint
);
router.put(
  "/:id",
  verifyToken,
  upload,
  complaintAttachmentMiddleware,
  validateUpdateComplaint,
  complaintController.updateComplaint
);
router.patch(
  "/:id/status",
  verifyToken,
  complaintController.updateComplaintStatus
);
router.delete("/:id", verifyToken, complaintController.deleteComplaint);
router.post("/get_complaint",verifyToken,complaintController.getCompliantRequest);
router.get("/get-expiring/complaint-request",verifyToken,complaintController.getExpiryCompliantRequest);

module.exports = router;
