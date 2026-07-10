const express = require("express");
const assignCaseTypeController = require("../controllers/assignCaseTypeToCase");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch(
  "/:case_id/assign-type",
  verifyToken,
  assignCaseTypeController.assignCaseType
);
router.post(
  "/:case_id/assign-voters",
  verifyToken,
  assignCaseTypeController.assignMembersToMultipleCases
);
//
module.exports = router;
