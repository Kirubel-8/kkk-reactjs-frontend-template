const express = require("express");
const woredaController = require("../controllers/woredaController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const router = express.Router();
const {
    validateCreateWoreda,
    validateUpdateWoreda
} = require("../validators/woredaValidator");

/**
 * @swagger
 * tags:
 *   name: Woredas
 *   description: API for managing woredas
 */

/**
 * @swagger
 * /woredas:
 *   post:
 *     summary: Create a new woreda
 *     tags: [Woredas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Woreda Name"
 *               zone_id:
 *                 type: string
 *                 example: "zone-uuid-here"
 *     responses:
 *       201:
 *         description: Woreda created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /woredas:
 *   get:
 *     summary: Get all woredas
 *     tags: [Woredas]
 *     responses:
 *       200:
 *         description: List of woredas
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /woredas/{id}:
 *   get:
 *     summary: Get a woreda by ID
 *     tags: [Woredas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Woreda ID
 *     responses:
 *       200:
 *         description: Woreda found
 *       404:
 *         description: Woreda not found
 */

/**
 * @swagger
 * /woredas/{id}:
 *   put:
 *     summary: Update a woreda by ID
 *     tags: [Woredas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Woreda ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Woreda Name"
 *               zone_id:
 *                 type: string
 *                 example: "zone-uuid-here"
 *     responses:
 *       200:
 *         description: Woreda updated successfully
 *       404:
 *         description: Woreda not found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /woredas/{id}:
 *   delete:
 *     summary: Delete a woreda by ID
 *     tags: [Woredas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Woreda ID
 *     responses:
 *       204:
 *         description: Woreda deleted successfully
 *       404:
 *         description: Woreda not found
 */

/**
 * @swagger
 * /woredas/zone:
 *   post:
 *     summary: Get woredas by zone ID
 *     tags: [Zones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               zone_id:
 *                 type: string
 *                 example: "zone-uuid-here"
 *     responses:
 *       200:
 *         description: List of woredas in the zone
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   woreda_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   zone_id:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: No woredas found for the zone
 *       400:
 *         description: Bad request
 */

router.use(verifyToken);

router.post("/", validateCreateWoreda, woredaController.createWoreda);
router.get("/", woredaController.getAllWoredas);
router.get("/:id", woredaController.getWoredaById);
router.get("/woreda-by-zone/:value", woredaController.getWoredasByZoneId);
router.put("/:id", validateUpdateWoreda, woredaController.updateWoreda);
router.delete("/:id", woredaController.deleteWoreda);

module.exports = router;
