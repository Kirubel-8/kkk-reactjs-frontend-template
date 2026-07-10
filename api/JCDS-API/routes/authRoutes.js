const express = require("express");
const router = express.Router();
const { validateLogin } = require("../validators/authValidator");
const {
  login,
  getPermissionsByUserId,
  logout,
  resetPasswordRequest,
  resetPassword,
} = require("../controllers/authController");
const { validatePasswordReset } = require("../validators/passwordResetValidator");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 *   /api/auth/login:
 *     post:
 *       tags: [Auth]
 *       summary: User login
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *                 password:
 *                   type: string
 *                   example: strongpassword123
 *       responses:
 *         200:
 *           description: Login successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     example: your.jwt.token.here
 *         401:
 *           description: Unauthorized - Invalid credentials
 *         400:
 *           description: Invalid input
 *         500:
 *           description: Server error
 */

/**
 * @swagger
 *   /api/auth/logout:
 *     post:
 *       tags: [Auth]
 *       summary: User logout
 *       description: Logs the user out by invalidating the current token.
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           required: true
 *           description: Bearer token received from login
 *           schema:
 *             type: string
 *             example: Bearer your.jwt.token.here
 *       responses:
 *         204:
 *           description: Logout successful
 *         401:
 *           description: Unauthorized - No active session or invalid token
 *         500:
 *           description: Server error
 */

/**
 * @swagger
 *   /api/auth/reset-password-request:
 *     post:
 *       tags: [Auth]
 *       summary: Request password reset
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *       responses:
 *         200:
 *           description: Password reset link sent to your email
 *         404:
 *           description: User not found
 *         500:
 *           description: Server error
 */

/**
 * @swagger
 *   /api/auth/reset-password:
 *     post:
 *       tags: [Auth]
 *       summary: Reset user password
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: reset-token-here
 *                 newPassword:
 *                   type: string
 *                   example: newpassword123
 *                 confirmPassword:
 *                   type: string
 *                   example: newpassword123
 *       responses:
 *         200:
 *           description: Password successfully reset
 *         400:
 *           description: Invalid token or passwords do not match
 *         500:
 *           description: Server error
 */

/**
 * @swagger
 *   /api/auth/permissions/{userId}:
 *     get:
 *       tags: [Auth]
 *       summary: Get permissions of a user
 *       parameters:
 *         - name: userId
 *           in: path
 *           required: true
 *           description: ID of the user to fetch permissions for
 *           schema:
 *             type: string
 *             example: 12345
 *       responses:
 *         200:
 *           description: Permissions fetched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: ["read", "write"]
 *         404:
 *           description: User not found
 *         500:
 *           description: Server error
 */

router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.post("/reset-password-request", resetPasswordRequest);
router.post("/reset-password", validatePasswordReset, resetPassword);
router.get("/permissions/:userId", getPermissionsByUserId);

module.exports = router;
