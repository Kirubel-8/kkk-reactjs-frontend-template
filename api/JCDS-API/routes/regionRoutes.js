const express = require("express");
const regionController = require("../controllers/regionController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizationMiddleware");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Regions
 *   description: API for managing regions
 */

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Create a new region
 *     tags: [Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Region Name"
 *     responses:
 *       201:
 *         description: Region created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Get all regions
 *     tags: [Regions]
 *     responses:
 *       200:
 *         description: List of regions
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /regions/{id}:
 *   get:
 *     summary: Get a region by ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Region ID
 *     responses:
 *       200:
 *         description: Region found
 *       404:
 *         description: Region not found
 */

/**
 * @swagger
 * /regions/{id}:
 *   put:
 *     summary: Update a region by ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Region ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Region Name"
 *     responses:
 *       200:
 *         description: Region updated successfully
 *       404:
 *         description: Region not found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     summary: Delete a region by ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Region ID
 *     responses:
 *       204:
 *         description: Region deleted successfully
 *       404:
 *         description: Region not found
 */
router.use(verifyToken);
router.post("/", regionController.createRegion);
router.get("/", regionController.getAllRegions);
router.get("/:id", regionController.getRegionById);
router.put("/:id", regionController.updateRegion);
router.delete("/:id", regionController.deleteRegion);

module.exports = router;
