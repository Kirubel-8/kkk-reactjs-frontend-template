const express = require("express");
const statusWithAgendaController = require("../controllers/statusweithagendaController");
const { verifyToken } = require("../middleware/authMiddleware");
// const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const router = express.Router();
const statusValidator = require("../validators/statusValidator");

/**
 * @swagger
 * tags:
 *   name: StatusWithAgenda
 *   description: API for managing status with agenda
 */

/**
 * @swagger
 * /status-with-agenda:
 *   post:
 *     summary: Create a new status with agenda
 *     tags: [StatusWithAgenda]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Status name"
 *               description:
 *                 type: string
 *                 example: "Status description"
 *               agenda_id:
 *                 type: string
 *                 example: "agenda-uuid"
 *     responses:
 *       201:
 *         description: Status with agenda created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /status-with-agenda:
 *   get:
 *     summary: Get all statuses with agendas
 *     tags: [StatusWithAgenda]
 *     responses:
 *       200:
 *         description: List of statuses with agendas
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /status-with-agenda/{id}:
 *   get:
 *     summary: Get a status with agenda by ID
 *     tags: [StatusWithAgenda]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: StatusWithAgenda ID
 *     responses:
 *       200:
 *         description: Status with agenda found
 *       404:
 *         description: Status with agenda not found
 */

/**
 * @swagger
 * /status-with-agenda/{id}:
 *   put:
 *     summary: Update a status with agenda by ID
 *     tags: [StatusWithAgenda]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: StatusWithAgenda ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Status Name"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               agenda_id:
 *                 type: string
 *                 example: "agenda-uuid"
 *     responses:
 *       200:
 *         description: Status with agenda updated successfully
 *       404:
 *         description: Status with agenda not found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /status-with-agenda/{id}:
 *   delete:
 *     summary: Delete a status with agenda by ID
 *     tags: [StatusWithAgenda]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: StatusWithAgenda ID
 *     responses:
 *       204:
 *         description: Status with agenda deleted successfully
 *       404:
 *         description: Status with agenda not found
 */

// Middleware for authentication and role authorization (uncomment if needed)

// router.use(authorizeRoles("Admin", "Super Admin"));

// router.use(verifyToken);
router.post(
  "/",
  statusValidator.validateStatusWithAgenda,
  statusWithAgendaController.createStatusWithAgenda
);

router.get("/", statusWithAgendaController.getAllStatusesWithAgendas);
router.get("/:id", statusWithAgendaController.getStatusWithAgendaById);
router.put(
  "/:id",
  statusValidator.validateStatusWithAgenda,
  statusWithAgendaController.updateStatusWithAgenda
);
router.delete("/:id", statusWithAgendaController.deleteStatusWithAgenda);


module.exports = router;
