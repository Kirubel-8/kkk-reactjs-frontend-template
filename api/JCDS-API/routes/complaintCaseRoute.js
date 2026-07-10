const express = require('express');
const router = express.Router();
const { getDisciplinaryRequest,
    getAssignedDisciplinaryRequests,
    getAssignedDisciplinaryRequestsById,
    updateEvidenceFileStatus,
    processDisciplinaryComplaint,
    getExpiringDisciplinary
} = require('../controllers/complaintCaseController');
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     Applicant:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *           example: "Abebe Kebede"
 *         email:
 *           type: string
 *           example: "abebe.kebede@example.com"
 *         phone_number:
 *           type: string
 *           example: "+251912345678"
 *     Issue:
 *       type: object
 *       properties:
 *         issue_id:
 *           type: string
 *           example: "111e2222-e33b-44d3-a456-555614174000"
 *         disciplinary_complaint_id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         description:
 *           type: string
 *           example: "Late submission of documents"
 *     Evidence:
 *       type: object
 *       properties:
 *         evidence_id:
 *           type: string
 *           example: "222e3333-e44b-55d3-a456-666614174000"
 *         disciplinary_complaint_id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         description:
 *           type: string
 *           example: "Uploaded PDF file"
 *         file_url:
 *           type: string
 *           example: "/uploads/evidence/file.pdf"
 *     Complaint:
 *       type: object
 *       properties:
 *         disciplinary_complaint_id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         judge_name:
 *           type: string
 *           example: "Judge Alemu"
 *         court_office:
 *           type: string
 *           example: "Addis Ababa Court"
 *         file_number:
 *           type: string
 *           example: "F123/2025"
 *         status:
 *           type: string
 *           example: "pending"
 *         get_user_id:
 *           type: string
 *           example: "987e6543-e21b-12d3-a456-426614174999"
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Issue'
 *         evidences:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Evidence'
 *         applicant:
 *           $ref: '#/components/schemas/Applicant'
 */

/**
 * @swagger
 * tags:
 *   name: Disciplinary Case
 *   description: Disciplinary Complaint Case
 */

/**
 * @swagger
 * /api/case/get-disciplinary-request:
 *   get:
 *     summary: Get the oldest unassigned disciplinary complaint
 *     description: Council Secteriat Head can get the oldest pending complaint. Cannot fetch a new complaint if previous is still pending.
 *     tags: [Disciplinary Case]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaint assigned successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Successful assignment
 *                 value:
 *                   message: "Complaint assigned to you"
 *                   complaint:
 *                     disciplinary_complaint_id: "123e4567-e89b-12d3-a456-426614174000"
 *                     judge_name: "Judge Alemu"
 *                     court_office: "Addis Ababa Court"
 *                     file_number: "F123/2025"
 *                     status: "pending"
 *                     get_user_id: "987e6543-e21b-12d3-a456-426614174999"
 *                     issues:
 *                       - issue_id: "111e2222-e33b-44d3-a456-555614174000"
 *                         disciplinary_complaint_id: "123e4567-e89b-12d3-a456-426614174000"
 *                         description: "Late submission of documents"
 *                     evidences:
 *                       - evidence_id: "222e3333-e44b-55d3-a456-666614174000"
 *                         disciplinary_complaint_id: "123e4567-e89b-12d3-a456-426614174000"
 *                         description: "Uploaded PDF file"
 *                         file_url: "/uploads/evidence/file.pdf"
 *                     applicant:
 *                       full_name: "Abebe Kebede"
 *                       email: "abebe.kebede@example.com"
 *                       phone_number: "+251912345678"
 *       400:
 *         description: User already has a pending complaint assigned
 *         content:
 *           application/json:
 *             examples:
 *               alreadyAssigned:
 *                 summary: Pending complaint exists
 *                 value:
 *                   error: "You already have a pending complaint assigned"
 *       401:
 *         description: Unauthorized, not logged in
 *         content:
 *           application/json:
 *             examples:
 *               unauthorized:
 *                 summary: Not logged in
 *                 value:
 *                   error: "You are not logged in"
 *       404:
 *         description: No pending disciplinary complaints available
 *         content:
 *           application/json:
 *             examples:
 *               notFound:
 *                 summary: No pending complaints
 *                 value:
 *                   message: "No pending disciplinary complaints available"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 value:
 *                   error: "Internal server error"
 */
router.get('/get-disciplinary-request', verifyToken, getDisciplinaryRequest);
router.get('/assigned-disciplinary-requests', verifyToken, getAssignedDisciplinaryRequests);
router.get('/disciplinary-requests/:disp_id', verifyToken, getAssignedDisciplinaryRequestsById);
router.patch("/disciplinary-evidence-file/:id/status", verifyToken, updateEvidenceFileStatus);
router.patch("/disciplinary-complaint/:id/process", verifyToken, processDisciplinaryComplaint);
router.get('/get-expiring/disciplinary-request', verifyToken, getExpiringDisciplinary);

module.exports = router;