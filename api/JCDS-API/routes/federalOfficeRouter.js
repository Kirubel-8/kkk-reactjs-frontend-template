"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { listCasesForFederalOffice } = require("../controllers/federalOfficeController");

router.use(verifyToken);

router.get("/", listCasesForFederalOffice);

module.exports = router;

