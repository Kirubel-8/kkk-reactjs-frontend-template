"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/letterController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/multerConfig");

// Auth required for all routes
router.use(verifyToken);

// Templates
router.get("/templates/:decisionId", ctrl.getTemplates);

// Letters CRUD
router.get("/:decisionId", ctrl.getLetters);
router.get("/letter/:letterId", ctrl.getLetter);
router.post("/:decisionId", ctrl.createLetter);
router.put("/letter/:letterId", ctrl.updateLetter);
router.post("/letter/:letterId/finalize", upload, ctrl.finalizeLetter);
router.delete("/letter/:letterId", ctrl.deleteLetter);

module.exports = router;
