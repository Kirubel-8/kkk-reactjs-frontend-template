const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const {
    validateCreatePermission,
    validateUpdatePermission
} = require("../validators/permissionValidator");

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management
 */

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     tags: [Permissions]
 *     summary: Create a new permission
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
 *               permission_name:
 *                 type: string
 *                 example: edit_users
 *               description:
 *                 type: string
 *                 example: Allows editing of user details
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Retrieve all permissions
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
 *         description: A list of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   permission_id:
 *                     type: integer
 *                     example: 1
 *                   permission_name:
 *                     type: string
 *                     example: edit_users
 *                   description:
 *                     type: string
 *                     example: Allows editing of user details
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Retrieve a permission by ID
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
 *         description: The permission ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permission_id:
 *                   type: integer
 *                   example: 1
 *                 permission_name:
 *                   type: string
 *                   example: edit_users
 *                 description:
 *                   type: string
 *                   example: Allows editing of user details
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/permissions/{id}:
 *   put:
 *     tags: [Permissions]
 *     summary: Update a permission by ID
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
 *         description: The permission ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission_name:
 *                 type: string
 *                 example: edit_users
 *               description:
 *                 type: string
 *                 example: Allows editing of user details
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/permissions/{id}:
 *   delete:
 *     tags: [Permissions]
 *     summary: Delete a permission by ID
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
 *         description: The permission ID
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Permission deleted successfully
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 */

router.use(verifyToken);
router.use(authorizeRoles("Admin", "Super Admin"));
router.post("/", validateCreatePermission, permissionController.createPermission);
router.get("/", permissionController.getAllPermissions);
router.get("/:id", permissionController.getPermissionById);
router.put("/:id", validateUpdatePermission, permissionController.updatePermission);
router.delete("/:id", permissionController.deletePermission);

module.exports = router;
