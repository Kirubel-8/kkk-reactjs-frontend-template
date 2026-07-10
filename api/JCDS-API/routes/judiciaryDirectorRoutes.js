const express = require("express");
const router = express.Router();
const directorController = require("../controllers/judiciaryDirectorController");
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizePermission } = require('../middleware/permissionMiddleware');

// Permission middleware for all routes
const requireDirectorPermission = authorizePermission(
  'JudiciaryDirectorate',
  'reviewDisciplinaryComplaint'
);

/**
 * @swagger
 * tags:
 *   name: JudiciaryDirector
 *   description: Judiciary Director case review endpoints
 */

/**
 * @swagger
 * /api/judiciary-director/get-request:
 *   get:
 *     summary: Get/assign a case for director review
 *     tags: [JudiciaryDirector]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Case assigned successfully
 *       404:
 *         description: No cases pending director approval
 */
router.get(
  "/get-request",
  verifyToken,
  requireDirectorPermission,
  directorController.getDirectorRequest
);

/**
 * @swagger
 * /api/judiciary-director/assigned-cases:
 *   get:
 *     summary: Get all cases assigned to this director
 *     tags: [JudiciaryDirector]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (optional)
 *     responses:
 *       200:
 *         description: Assigned cases retrieved successfully
 *       404:
 *         description: No cases assigned
 */
router.get(
  "/assigned-cases",
  verifyToken,
  requireDirectorPermission,
  directorController.getAllAssignedCases
);

/**
 * @swagger
 * /api/judiciary-director/assigned-cases/{id}:
 *   get:
 *     summary: Get specific assigned case by ID
 *     tags: [JudiciaryDirector]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case retrieved successfully
 *       404:
 *         description: Case not found or not assigned to you
 */
router.get(
  "/assigned-cases/:id",
  verifyToken,
  requireDirectorPermission,
  directorController.getAssignedCaseById
);

/**
 * @swagger
 * /api/judiciary-director/approve/{id}:
 *   post:
 *     summary: Approve case (sends to file organizer)
 *     tags: [JudiciaryDirector]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case approved successfully
 *       400:
 *         description: Case is not pending director approval
 *       404:
 *         description: Case not found or not assigned to you
 */
router.post(
  "/approve/:id",
  verifyToken,
  requireDirectorPermission,
  directorController.approveCase
);

/**
 * @swagger
 * /api/judiciary-director/return/{id}:
 *   post:
 *     summary: Return case to previous stage with reason
 *     tags: [JudiciaryDirector]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for returning the case
 *                 example: "Missing evidence"
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Case returned successfully
 *       400:
 *         description: Reason is required or case is not pending director approval
 *       404:
 *         description: Case not found or not assigned to you
 */
router.post(
  "/return/:id",
  verifyToken,
  requireDirectorPermission,
  directorController.returnCase
);

module.exports = router;
