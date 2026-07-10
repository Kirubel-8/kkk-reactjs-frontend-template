const express = require("express");
const councilDecisionController = require("../controllers/councilDecisionController");
const {
  validateSubmitCouncilDecision,
} = require("../validators/councilDecisionValidator");
const uploadDecision = require("../middleware/councilMemberDecisionMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Final Decision
 *   description: API for council decisions and final case decision
 */
router.use(verifyToken);
/**
 * @swagger
 * /api/final-decision/submit-decision:
 *   post:
 *     summary: Submit a council member's decision for a case
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               case_id:
 *                 type: string
 *                 example: "CASE-123"
 *               decision_status_id:
 *                 type: string
 *                 example: "STATUS-001"
 *               comment:
 *                 type: string
 *                 example: "This is my opinion about this case."
 *               is_eligable:
 *                 type: boolean
 *                 example: true
 *               decision_document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Decision submitted successfully
 *       400:
 *         description: Validation or logical error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – user not assigned to this case
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/final-decision/council/final/decision/{case_id}:
 *   get:
 *     summary: Get the final decision for a case
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Final decision retrieved successfully
 *       404:
 *         description: Final decision not found
 *       400:
 *         description: Invalid case ID
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/final-decision/council-decisions/{case_id}:
 *   get:
 *     summary: Get all individual council member decisions for a case
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: List of council decisions
 *       400:
 *         description: Invalid case ID
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/final-decision/statistics/{case_id}:
 *   get:
 *     summary: Get decision statistics for a case (submitted, pending, breakdown)
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Decision statistics retrieved
 *       400:
 *         description: Invalid case ID
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/final-decision/council-review:
 *   get:
 *     summary: Get all cases currently Under Council Review
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved cases under council review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Case with all related review and attachment information
 *       500:
 *         description: Server error while fetching cases
 */

/**
 * @swagger
 * /api/final-decision/case-details/{caseId}:
 *   get:
 *     summary: Get full case details including optional relations
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Case ID
 *     responses:
 *       200:
 *         description: Case details retrieved successfully
 *       404:
 *         description: Case not found
 *       500:
 *         description: Server error
 */
router.get(
  "/case-details/:caseId",

  councilDecisionController.getCaseDetails
);

/**
 * @swagger
 * /api/final-decision/available-council-members:
 *   get:
 *     summary: Get all available council members
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved council members
 *       500:
 *         description: Server error
 */
router.get(
  "/available-council-members",

  councilDecisionController.getAvailableCouncilMembers
);
router.post(
  "/:case_id/assign-voters",
  verifyToken,
  councilDecisionController.assignMembersToMultipleCases
);
/**
 * @swagger
 * /api/final-decision/decision-options:
 *   get:
 *     summary: Get all decision options for main council
 *     tags: [Final Decision]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved decision options
 *       500:
 *         description: Server error
 */
router.get(
  "/decision-options",

  councilDecisionController.getDecisionOptions
);
// Add this new route
router.get(
  "/user-vote-status/:case_id",

  councilDecisionController.getUserVoteStatus
);
router.get(
  "/total-voting-members",
  councilDecisionController.getTotalVotingMembers
);
router.post(
  "/submit-decision",

  councilDecisionController.submitCouncilDecision
);

router.get(
  "/council-review",
  councilDecisionController.getCasesUnderCouncilReview
);
router.get(
  "/council/final/decision/:case_id",
  councilDecisionController.getFinalDecision
);

router.get(
  "/case/:case_id/votes",

  councilDecisionController.getCaseDecisionVotes
);

router.get(
  "/council-decisions/:case_id",
  councilDecisionController.getCouncilDecisions
);

router.get(
  "/statistics/:case_id",
  councilDecisionController.getDecisionStatistics
);
// Get assigned members for a case
router.get(
  "/assigned-members/:case_id",
  verifyToken,
  // permissionMiddleware(["council_head"]),
  councilDecisionController.getAssignedMembersForCase
);
// Remove members from a case
router.post(
  "/remove-members",
  verifyToken,
  // permissionMiddleware(["council_head"]),
  councilDecisionController.removeMembersFromCase
);

// Get disciplinary cases with final decision (for letter generation)
router.get(
  "/disciplinary-cases-with-decision",
  verifyToken,
  councilDecisionController.getDisciplinaryCasesWithDecision
);

module.exports = router;
