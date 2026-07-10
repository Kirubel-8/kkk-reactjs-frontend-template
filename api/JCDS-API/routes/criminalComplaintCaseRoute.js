const express = require("express");
const upload = require("../middleware/multerConfig");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  listComplaintsAndCases,
  getComplaintCases,
  bulkApproveReject,
  getComplaintForReviewById,
  approveComplaintForCaseReview,
  rejectComplaintForCaseReview,
  getCaseDetailForDecision,
  makeDecisionOnCase,
  getDecisionStatuses,
} = require("../controllers/criminalComplaintCaseController");

/**
 * @swagger
 * tags:
 *   - name: Criminal Complaint Case
 *     description: Endpoints for reviewing complaints and making case decisions
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     BulkApproveRejectItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Complaint or case identifier
 *         action:
 *           type: string
 *           enum: [approve, reject]
 *         comment:
 *           type: string
 *           nullable: true
 *       required: [id, action]
 *     DecisionRequest:
 *       type: object
 *       properties:
 *         decision:
 *           type: string
 *           enum: [approve, reject]
 *         comment:
 *           type: string
 *           nullable: true
 *     CommonResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           nullable: true
 */

/**
 * @swagger
 * /criminal-complaint-cases:
 *   get:
 *     summary: List complaints and cases
 *     description: Returns a list of complaints and cases available for review.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, listComplaintsAndCases);

/**
 * Cases-only overview for office table (status + pagination).
 */
router.get("/cases/get-complaint-cases", verifyToken, getComplaintCases);

// Complaint operations
/**
 * @swagger
 * /criminal-complaint-cases/complaints/{id}:
 *   get:
 *     summary: Get complaint for review by ID
 *     description: Fetches complaint details for the specified complaint ID.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint identifier
 *     responses:
 *       200:
 *         description: Complaint fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Complaint not found
 */
router.get("/complaints/:id", verifyToken, getComplaintForReviewById);

/**
 * @swagger
 * /criminal-complaint-cases/complaints/{id}/approve:
 *   post:
 *     summary: Approve complaint for case review
 *     description: Approves the complaint and moves it forward in the case review process.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint identifier
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Complaint approved
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Complaint not found
 */
router.post(
  "/complaints/:id/approve",
  verifyToken,
  approveComplaintForCaseReview
);

/**
 * @swagger
 * /criminal-complaint-cases/complaints/{id}/reject:
 *   post:
 *     summary: Reject complaint for case review
 *     description: Rejects the complaint with an optional reason/comment.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint identifier
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 nullable: true
 *               comment:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Complaint rejected
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Complaint not found
 */
router.post("/complaints/:id/reject", verifyToken, rejectComplaintForCaseReview);

/**
 * @swagger
 * /criminal-complaint-cases/complaints/bulk-approve-reject:
 *   post:
 *     summary: Bulk approve or reject complaints
 *     description: Applies approve/reject actions in bulk to multiple complaint IDs.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BulkApproveRejectItem'
 *             required: [actions]
 *     responses:
 *       200:
 *         description: Actions processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonResponse'
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 */
router.post("/complaints/bulk-approve-reject", verifyToken, bulkApproveReject);

// Case operations
/**
 * @swagger
 * /criminal-complaint-cases/cases/{id}:
 *   get:
 *     summary: Get case detail for viewing or decision
 *     description: Retrieves the case detail. Can view both open and closed cases.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case identifier
 *     responses:
 *       200:
 *         description: Case details retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Case not found
 */
router.get("/cases/:id", verifyToken, getCaseDetailForDecision);

/**
 * @swagger
 * /criminal-complaint-cases/cases/{id}/decide:
 *   post:
 *     summary: Make a decision on a case
 *     description: Submits a decision with optional comment and attachments.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case identifier
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approve, reject]
 *               comment:
 *                 type: string
 *                 nullable: true
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Decision submitted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Case not found
 */
router.post("/cases/:id/decide", verifyToken, upload, makeDecisionOnCase);

/**
 * @swagger
 * /criminal-complaint-cases/cases/decision-statuses:
 *   get:
 *     summary: List decision statuses
 *     description: Returns the available decision statuses for cases.
 *     tags: [Criminal Complaint Case]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statuses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/decision-statuses", verifyToken, getDecisionStatuses);

module.exports = router;
