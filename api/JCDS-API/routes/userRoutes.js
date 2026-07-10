const express = require("express");
const router = express.Router();

const {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateProfile,
} = require("../validators/userValidator");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const baseDirectory = path.join(__dirname, "..", "public");

const { v4: uuidv4 } = require("uuid");
const {
  createUser,
  updateUserStatus,
  getAllUsers,
  getUserById,
  getUsersByTeamId,
  updateUser,
  deleteUser,
  assignRoleToUser,
  removeRoleFromUser,
  assignDepartmentToUser,
  removeUserFromDepartment,
  getUserProfile,
  updateUserProfile,
  getUsersByDepartmentId,
  unassignDepartmentAndTeamFromUser
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
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
 *               first_name:
 *                 type: string
 *                 example: John
 *               middle_name:
 *                 type: string
 *                 example: A.
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Retrieve all users
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
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   full_name:
 *                     type: string
 *                     example: John A. Doe
 *                   email:
 *                     type: string
 *                     example: johndoe@example.com
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other]
 *                     example: male
 *                   account_status:
 *                     type: boolean
 *                     example: true
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Retrieve a user by ID
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
 *         description: The user's ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 full_name:
 *                   type: string
 *                   example: John A. Doe
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *                 gender:
 *                   type: string
 *                   enum: [male, female, other]
 *                   example: male
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user by ID
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
 *         description: The user's ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Jane
 *               middle_name:
 *                 type: string
 *                 example: B.
 *               last_name:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 example: janesmith@example.com
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: female
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user by ID
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
 *         description: The user's ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{userId}/roles/{roleId}:
 *   post:
 *     tags: [Users]
 *     summary: Assign a role to a user
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: roleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Role assigned to user successfully
 *       500:
 *         description: Failed to assign role
 */

/**
 * @swagger
 * /api/users/{userId}/roles/{roleId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a role from a user
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: roleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role removed from user successfully
 *       500:
 *         description: Failed to remove role
 */

/**
 * @swagger
 * /api/users/{userId}/departments/{departmentId}:
 *   post:
 *     tags: [Users]
 *     summary: Assign a department to a user
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: departmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Department assigned to user successfully
 *       500:
 *         description: Failed to assign department
 */

/**
 * @swagger
 * /api/users/{userId}/departments/{departmentId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a department from a user
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer your.jwt.token.here
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: departmentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Department removed from user successfully
 *       500:
 *         description: Failed to remove department
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Retrieve the authenticated user's profile (me)
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
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 full_name:
 *                   type: string
 *                   example: John A. Doe
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *                 gender:
 *                   type: string
 *                   enum: [male, female, other]
 *                   example: male
 *       401:
 *         description: Unauthorized, invalid token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update the authenticated user's profile (me)
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
 *               first_name:
 *                 type: string
 *                 example: Jane
 *               middle_name:
 *                 type: string
 *                 example: B.
 *               last_name:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 example: janesmith@example.com
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: female
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized, invalid token
 *       500:
 *         description: Server error
 */



// Multer config for user creation (memory storage, file type filter)
const allowedMimeTypes = [
  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv", "text/plain",
  "image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp", "image/svg+xml",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip", "application/x-rar-compressed", "application/x-tar", "application/gzip"
];

const userCreateUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type."));
    }
    cb(null, true);
  },
});

// ...existing code...

router.use(verifyToken);
router.get("/me", getUserProfile);
router.put("/me", updateUserProfile);

// router.use(authorizeRoles("Admin", "Super Admin"));

router.post("/",  userCreateUpload.fields([
  { name: "signature", maxCount: 1 },
  { name: "titer", maxCount: 1 }
]), createUser);
router.put("/:id/status", updateUserStatus);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.get("/team/:teamId", getUsersByTeamId);
router.put("/:id", userCreateUpload.fields([
  { name: "signature", maxCount: 1 },
  { name: "titer", maxCount: 1 }
]), updateUser);
router.delete("/:id", deleteUser);
router.post("/assign-role", assignRoleToUser);
router.delete("/:userId/:roleId", removeRoleFromUser);
router.post("/assign-department", assignDepartmentToUser);
router.delete("/:userId/:departmentId", removeUserFromDepartment);
router.get("/department/:departmentId/users", getUsersByDepartmentId);
router.put("/:userId/unassign", unassignDepartmentAndTeamFromUser);

module.exports = router;
