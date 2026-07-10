const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const {
  validateCreateDepartment,
  validateUpdateDepartment,
} = require("../validators/departmentValidator");

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management
 */

/**
 * @swagger
 * /api/departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create a new department
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         description: Bearer token received from login
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Human Resources
 *               description:
 *                 type: string
 *                 example: Handles employee relations and benefits
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: Retrieve all departments
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         description: Bearer token received from login
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *     responses:
 *       200:
 *         description: A list of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department_id:
 *                     type: string
 *                     example: 1
 *                   department_name:
 *                     type: string
 *                     example: Human Resources
 *                   description:
 *                     type: string
 *                     example: Handles employee relations and benefits
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Retrieve a department by ID
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         description: Bearer token received from login
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: id
 *         in: path
 *         required: true
 *         description: The department ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 department_id:
 *                   type: string
 *                   example: 1
 *                 department_name:
 *                   type: string
 *                   example: Human Resources
 *                 description:
 *                   type: string
 *                   example: Handles employee relations and benefits
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     tags: [Departments]
 *     summary: Update a department by ID
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         description: Bearer token received from login
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: id
 *         in: path
 *         required: true
 *         description: The department ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_name:
 *                 type: string
 *                 example: Human Resources
 *               description:
 *                 type: string
 *                 example: Handles employee relations and benefits
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     tags: [Departments]
 *     summary: Delete a department by ID
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         description: Bearer token received from login
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: id
 *         in: path
 *         required: true
 *         description: The department ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */

router.use(verifyToken);
// router.use(authorizeRoles("Admin", "Super Admin"));
router.post(
  "/",
  validateCreateDepartment,
  departmentController.createDepartment
);
router.get("/", departmentController.getAllDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.put(
  "/:id",
  validateCreateDepartment,
  departmentController.updateDepartment
);
router.delete("/:id", departmentController.deleteDepartment);

module.exports = router;
