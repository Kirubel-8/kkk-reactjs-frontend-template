const express = require("express");
const agendaController = require("../controllers/agendaController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const router = express.Router();
const agendaValidator = require("../validators/agendaValidator");

/**
 * @swagger
 * tags:
 *   name: Agendas
 *   description: API for managing agenda type
 */

/**
 * @swagger
 * /agenda-type:
 *   post:
 *     summary: Create a new agenda type
 *     tags: [Agenda]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "agenda type name"
 *     responses:
 *       201:
 *         description: Agenda Type created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /agenda-type:
 *   get:
 *     summary: Get all agenda type
 *     tags: [Agenda]
 *     responses:
 *       200:
 *         description: List of agenda type
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /agenda-type/{id}:
 *   get:
 *     summary: Get a agenda type by ID
 *     tags: [Agenda]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agenda Type ID
 *     responses:
 *       200:
 *         description: Agenda Type found
 *       404:
 *         description: Agenda Type not found
 */

/**
 * @swagger
 * /agenda-type/{id}:
 *   put:
 *     summary: Update a agenda type by ID
 *     tags: [Agenda]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agenda Type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Agenda Type Name"
 *     responses:
 *       200:
 *         description: Agenda Type updated successfully
 *       404:
 *         description: Agenda Type not found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /agenda-type/{id}:
 *   delete:
 *     summary: Delete a agenda type by ID
 *     tags: [Agenda]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agenda Type ID
 *     responses:
 *       204:
 *         description: Agenda Type deleted successfully
 *       404:
 *         description: Agenda Type not found
 */

router.use(verifyToken);
router.use(authorizeRoles("Admin", "Super Admin"));
router.post(
  "/",
  agendaValidator.validateAgenda,
  agendaController.createAgenda
);

router.get("/", agendaController.getAllAgendas);
router.get("/:id", agendaController.getAgendaById);
router.put(
  "/:id",
  agendaValidator.validateAgenda,
  agendaController.updateAgenda
);
router.delete("/:id", agendaController.deleteAgenda);

module.exports = router;
