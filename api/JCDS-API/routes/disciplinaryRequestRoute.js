const express = require("express");
const router = express.Router();
const disciplinaryController = require("../controllers/disciplinaryRequestController");
const paginationMiddleware = require("../middleware/paginationMiddleware");
const { verifyToken } = require('../middleware/authMiddleware');
const { validateComplaint, parseJsonFields } = require('../validators/disciplinaryComplaintValidator')

const { uploadMultiple, uploadEvidence } = require('../middleware/disciplinaryFileUploadMiddleware')
    /**
     * @swagger
     * tags:
     *   name: DisciplinaryRequests
     *   description: API for managing disciplinary complaints
     */

/**
 * @swagger
 * /api/disciplinary-request:
 *   post:
 *     summary: Create a new disciplinary complaint
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judge_name:
 *                 type: string
 *                 example: "Judge John Doe"
 *               court_office:
 *                 type: string
 *                 example: "Federal Court"
 *               file_number:
 *                 type: string
 *                 example: "12345"
 *               status:
 *                 type: string
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request:
 *   get:
 *     summary: Get all disciplinary complaints with pagination
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of complaints
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request/{id}:
 *   get:
 *     summary: Get a disciplinary complaint by ID
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint found
 *       404:
 *         description: Complaint not found
 */

/**
 * @swagger
 * /api/disciplinary-request/{complaintId}:
 *   put:
 *     summary: Update a complaint with files
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Complaint updated successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request/{id}/signature:
 *   post:
 *     summary: Upload a signature for a complaint
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Signature uploaded successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request/{id}/evidence:
 *   post:
 *     summary: Upload evidence files for a complaint
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Evidence uploaded successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request/{id}/status:
 *   patch:
 *     summary: Update the status of a complaint
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request/{applicant_id}/applicants:
 *   get:
 *     summary: Get complaints by applicant
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Applicant ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of complaints by applicant
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/disciplinary-request/delete/{id}:
 *   delete:
 *     summary: Delete a disciplinary complaint
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint deleted successfully
 *       404:
 *         description: Complaint not found
 */

/**
 * @swagger
 * /api/disciplinary-request/evidence/{id}:
 *   delete:
 *     summary: Delete a specific evidence file
 *     tags: [DisciplinaryRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Evidence ID
 *     responses:
 *       200:
 *         description: Evidence deleted successfully
 *       404:
 *         description: Evidence not found
 */


router.post("/", verifyToken, disciplinaryController.discliplinaryComplaintRequest);
router.get("/", verifyToken, paginationMiddleware, disciplinaryController.getDiscliplinaryComplaintRequest);
router.get("/my-complaints", verifyToken, paginationMiddleware, disciplinaryController.getComplaintsByApplicant);
router.get("/:id", verifyToken, disciplinaryController.getDiscliplinaryComplaintRequestById);
router.put("/:complaintId", verifyToken, disciplinaryController.updateComplaintWithFiles);
router.post("/:id/signature", verifyToken, disciplinaryController.uploadSignature);
router.post("/:id/evidence", verifyToken, disciplinaryController.addEvidenceWithFile);
router.patch("/:id/status", verifyToken, disciplinaryController.updateDiscliplinaryComplaintRequestStatus);
router.delete("/delete/:id", verifyToken, disciplinaryController.deleteDisciplinaryComplaint);
router.delete("/evidence/:id", verifyToken, disciplinaryController.deleteEvidence)

// Replace or Delete Rejected Evidence (Applicant only)
router.patch(
  "/evidence/:evidence_id/modify",
  verifyToken,
  uploadEvidence,
  disciplinaryController.modifyRejectedEvidence
);

// Add New Evidence to an Existing Complaint (Applicant only)
router.post(
  "/:complaint_id/evidence/add",
  verifyToken,
  disciplinaryController.addEvidenceToComplaint
);

// Raise issue for disciplinary complaint
router.post(
  "/raise_issue_disciplinary_complaint/:disciplinary_complaint_id",
  verifyToken,
  disciplinaryController.raiseIssueDisciplinaryComplaint
);

// Get all rejections for a disciplinary complaint
router.get(
  "/get_disciplinary_complaint_rejection/:disciplinary_complaint_id",
  verifyToken,
  disciplinaryController.getDisciplinaryComplaintRejection
);

module.exports = router;