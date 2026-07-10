const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const {
  validateCreateRole,
  validateUpdateRole,
} = require("../validators/roleValidator");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management
 */

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
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
 *                 example: Admin
 *               description:
 *                 type: string
 *                 example: This role has updated access rights.
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 064dc05b-5293-4905-a1f0-17f39a762da5
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Retrieve all roles
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
 *         description: A list of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role_id:
 *                     type: string  # Changed to string to match UUID format
 *                     example: "995e6e58-75f8-404b-9923-1823a396fc4e"
 *                   name:
 *                     type: string
 *                     example: Admin
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Retrieve a role by ID
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
 *         schema:
 *           type: string  # Changed to string to match UUID format
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role_id:
 *                   type: string
 *                   example: "995e6e58-75f8-404b-9923-1823a396fc4e"
 *                 name:
 *                   type: string
 *                   example: Admin
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update a role by ID
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
 *         schema:
 *           type: string  # Changed to string to match UUID format
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Admin
 *               description:
 *                 type: string
 *                 example: This role has updated access rights.
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 064dc05b-5293-4905-a1f0-17f39a762da5
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role by ID
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
 *         schema:
 *           type: string  # Changed to string to match UUID format
 *     responses:
 *       204:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

router.use(verifyToken);
router.use(authorizeRoles("Admin", "Super Admin"));
router.post("/", validateCreateRole, roleController.createRole);
router.get("/", roleController.getAllRoles);
router.get("/:id", roleController.getRoleById);
router.put("/:id", validateUpdateRole, roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
