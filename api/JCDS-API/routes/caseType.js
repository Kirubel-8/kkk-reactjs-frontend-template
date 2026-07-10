const express = require("express");
const caseTypeController = require("../controllers/caseTypeController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const router = express.Router();
const caseTypeValidator = require("../validators/caseTypeValidator");

/**
 * @swagger
 * tags:
 *   name: CaseType
 *   description: API for managing case type
 */

/**
 * @swagger
 * /case-type:
 *   post:
 *     summary: Create a new case type
 *     tags: [CaseType]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "case type name"
 *     responses:
 *       201:
 *         description: Case Type created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /case-type:
 *   get:
 *     summary: Get all case type
 *     tags: [CaseType]
 *     responses:
 *       200:
 *         description: List of case type
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /case-type/{id}:
 *   get:
 *     summary: Get a case type by ID
 *     tags: [CaseType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case Type ID
 *     responses:
 *       200:
 *         description: Case Type found
 *       404:
 *         description: Case Type not found
 */

/**
 * @swagger
 * /case-type/{id}:
 *   put:
 *     summary: Update a case type by ID
 *     tags: [CaseType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case Type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Case Type Name"
 *     responses:
 *       200:
 *         description: Case Type updated successfully
 *       404:
 *         description: Case Type not found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /case-type/{id}:
 *   delete:
 *     summary: Delete a case type by ID
 *     tags: [CaseType]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case Type ID
 *     responses:
 *       204:
 *         description: Case Type deleted successfully
 *       404:
 *         description: Case Type not found
 */

// router.use(verifyToken);
// router.use(authorizeRoles("Admin", "Super Admin"));
router.post(
  "/",
  caseTypeValidator.validateCaseType,
  caseTypeController.createCaseType
);

router.post("/assign/:case_id", caseTypeController.assignCaseType);
router.get("/", caseTypeController.getAllCaseTypes);
router.get("/:id", caseTypeController.getCaseTypeById);
router.put(
  "/:id",
  caseTypeValidator.validateCaseType,
  caseTypeController.updateCaseType
);
router.delete("/:id", caseTypeController.deleteCaseType);

module.exports = router;
