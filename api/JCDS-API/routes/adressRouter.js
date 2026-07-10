const express = require("express");
const router = express.Router();
const { getLocations } = require("../controllers/addressController");

router.get("/", getLocations);

module.exports = router;
