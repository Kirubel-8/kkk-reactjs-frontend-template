const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");

const {
  validateCreateTeam,
  validateUpdateTeam,
} = require("../validators/teamValidator");
/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: API for managing teams
 */

/**
 * @swagger
 * path:
 *  /api/teams:
 *    post:
 *      summary: Create a new team
 *      tags: [Teams]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: Name of the team
 *                  example: Marketing Team
 *                department_id:
 *                  type: string
 *                  description: Department ID the team belongs to
 *                  example: "f7cdbb8a-e0c7-437e-a663-8b1f6d18a8ab"
 *                created_by:
 *                  type: string
 *                  description: The creator of the team
 *                  example: "admin"
 *      responses:
 *        201:
 *          description: Team created successfully
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Team'
 *        400:
 *          description: Invalid input data
 */

/**
 * @swagger
 * path:
 *  /api/teams:
 *    get:
 *      summary: Retrieve all teams
 *      tags: [Teams]
 *      responses:
 *        200:
 *          description: A list of all teams
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Team'
 */

/**
 * @swagger
 * path:
 *  /api/teams/{id}:
 *    get:
 *      summary: Retrieve a team by ID
 *      tags: [Teams]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: The ID of the team to retrieve
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: The requested team
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Team'
 *        404:
 *          description: Team not found
 */

/**
 * @swagger
 * path:
 *  /api/teams/{id}:
 *    put:
 *      summary: Update a team by ID
 *      tags: [Teams]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: The ID of the team to update
 *          schema:
 *            type: string
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: Name of the team
 *                  example: "Updated Marketing Team"
 *                department_id:
 *                  type: string
 *                  description: Department ID
 *                  example: "f7cdbb8a-e0c7-437e-a663-8b1f6d18a8ab"
 *      responses:
 *        200:
 *          description: Team updated successfully
 *        400:
 *          description: Invalid data for team
 *        404:
 *          description: Team not found
 */

/**
 * @swagger
 * path:
 *  /api/teams/{id}:
 *    delete:
 *      summary: Delete a team by ID
 *      tags: [Teams]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: The ID of the team to delete
 *          schema:
 *            type: string
 *      responses:
 *        204:
 *          description: Team deleted successfully
 *        404:
 *          description: Team not found
 */

/**
 * @swagger
 * path:
 *  /api/teams/department/{departmentId}:
 *    get:
 *      summary: Retrieve teams by department ID
 *      tags: [Teams]
 *      parameters:
 *        - in: path
 *          name: departmentId
 *          required: true
 *          description: The department ID to fetch teams for
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: A list of teams in the specified department
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Team'
 *        404:
 *          description: Department not found or no teams in the department
 */

router.use(verifyToken);
// router.use(authorizeRoles("Admin", "Super Admin"));
router.post("/", validateCreateTeam, teamController.createTeam);
router.get("/", teamController.getAllTeams);
router.get("/:id", teamController.getTeamById);
router.get("/department/:departmentId", teamController.getTeamsByDepartmentId);
router.put("/:id", validateUpdateTeam, teamController.updateTeam);
router.delete("/:id", teamController.deleteTeam);
router.get(
  "/by-department/:department_id",
  teamController.getTeamsByDepartment
);
// router.get("/by-department", teamController.getTeamsByDepartment);

module.exports = router;
