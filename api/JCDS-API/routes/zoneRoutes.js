const express = require("express");
const zoneController = require("../controllers/zoneController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const router = express.Router();
const {
    validateUpdateZone,
    validateCreateZone
} = require("../validators/zoneValidator");

/**
 * @swagger
 * tags:
 *   name: Zones
 *   description: API for managing zones
 */

/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Create a new zone
 *     tags: [Zones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Zone Name"
 *               region_id:
 *                 type: string
 *                 example: "region-uuid-here"
 *     responses:
 *       201:
 *         description: Zone created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Get all zones
 *     tags: [Zones]
 *     responses:
 *       200:
 *         description: List of zones
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /zones/{id}:
 *   get:
 *     summary: Get a zone by ID
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     responses:
 *       200:
 *         description: Zone found
 *       404:
 *         description: Zone not found
 */

/**
 * @swagger
 * /zones/{id}:
 *   put:
 *     summary: Update a zone by ID
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Zone Name"
 *               region_id:
 *                 type: string
 *                 example: "region-uuid-here"
 *     responses:
 *       200:
 *         description: Zone updated successfully
 *       404:
 *         description: Zone not found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Delete a zone by ID
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     responses:
 *       204:
 *         description: Zone deleted successfully
 *       404:
 *         description: Zone not found
 */

/**
 * @swagger
 * /zones/region:
 *   post:
 *     summary: Get zones by region ID
 *     tags: [Zones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               region_id:
 *                 type: string
 *                 example: "region-uuid-here"
 *     responses:
 *       200:
 *         description: List of zones in the region
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   zone_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   region_id:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: No zones found for the region
 *       400:
 *         description: Bad request
 */

router.post("/", zoneController.createZone);

router.use(verifyToken);

router.get("/", zoneController.getAllZones);
router.get("/:id", zoneController.getZoneById);
router.get("/region/:id", zoneController.getZonesByRegionId);
router.put("/:id", validateUpdateZone, zoneController.updateZone);
router.delete("/:id", zoneController.deleteZone);

module.exports = router;
