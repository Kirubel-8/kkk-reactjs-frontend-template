const express = require('express');
const router = express.Router();
const courtOfficeController = require('../controllers/courtOfficeController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');
const uploadCourtOffice = require("../middleware/multerCourtOffice");
const { authorizePermission } = require('../middleware/permissionMiddleware');

/**
 * @swagger
 * tags:
 *   name: CourtOffice
 *   description: Court Office document request management
 */

/**
 * @swagger
 * /api/court-office/document-requests:
 *   get:
 *     summary: Get all document requests for the user's court office
 *     tags: [CourtOffice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, fulfilled, returned_empty, all]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of document requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/document-requests',
  verifyToken,
  authorizePermission('CourtOffice', 'viewDocumentRequests'),
  courtOfficeController.getDocumentRequests
);

/**
 * @swagger
 * /api/court-office/document-requests/{id}:
 *   get:
 *     summary: Get a specific document request details
 *     tags: [CourtOffice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Disciplinary complaint ID
 *     responses:
 *       200:
 *         description: Request details
 *       404:
 *         description: Request not found
 */
router.get(
  '/document-requests/:id',
  verifyToken,
  authorizePermission('CourtOffice', 'viewDocumentRequests'),
  courtOfficeController.getRequestById
);

/**
 * @swagger
 * /api/court-office/upload/{id}:
 *   post:
 *     summary: Upload documents for a request
 *     tags: [CourtOffice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Disciplinary complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: No files uploaded
 */
router.post(
  '/upload/:id',
  verifyToken,
  authorizePermission('CourtOffice', 'uploadDocuments'),
  uploadCourtOffice.array("files", 10),
  courtOfficeController.uploadDocuments
);

/**
 * @swagger
 * /api/court-office/return-empty/{id}:
 *   post:
 *     summary: Return a request without documents
 *     tags: [CourtOffice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Disciplinary complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response submitted successfully
 *       400:
 *         description: Reason is required
 */
router.post(
  '/return-empty/:id',
  verifyToken,
  authorizePermission('CourtOffice', 'uploadDocuments'),
  courtOfficeController.returnEmpty
);

// router.get('/court-office/uploaded/:id', verifyToken, authorizePermission('CourtOffice'),
// courtOfficeController.getUploadedDocuments);


module.exports = router;
