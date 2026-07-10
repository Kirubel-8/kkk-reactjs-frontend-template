"use strict";

const { v4: uuidv4 } = require("uuid");
const {
	CaseDecision,
	CaseDecisionLetter,
	Case,
	Complaint,
	DisciplinaryComplaint,
	StatusWithAgenda,
	CustomerAccount,
	User,
} = require("../models");
const {
	getTemplatesForDecision,
	populateTemplate,
	buildPlaceholders,
} = require("../utils/letterTemplates");

// =============================================================================
// HELPERS
// =============================================================================

/** Standard error response */
const errorResponse = (res, status, message) => res.status(status).json({ error: message });

/** Require authenticated user */
const requireAuth = (req, res) => {
	const userId = req.user?.id;
	if (!userId) {
		errorResponse(res, 401, "Unauthorized");
		return null;
	}
	return userId;
};

/** Fetch decision with all related data */
const fetchDecisionWithRelations = async (decisionId) => {
	return CaseDecision.findByPk(decisionId, {
		include: [
			{ model: StatusWithAgenda, as: "status" },
			{
				model: Case,
				as: "case",
				include: [
					{ model: Complaint, as: "complaint", include: [{ model: CustomerAccount, as: "applicant" }] },
					{ model: DisciplinaryComplaint, as: "disciplinary_complaint", include: [{ model: CustomerAccount, as: "applicant" }] },
				],
			},
			{ association: "letterRef" },
		],
	});
};

// =============================================================================
// CONTROLLERS
// =============================================================================

/**
 * GET /api/letters/templates/:decisionId
 * Get populated templates for a decision
 */
exports.getTemplates = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const { decisionId } = req.params;
		const decision = await fetchDecisionWithRelations(decisionId);

		if (!decision) return errorResponse(res, 404, "Decision not found");
		if (!decision.status?.decision_type) return errorResponse(res, 400, "Decision type not found");

		const complaint = decision.case?.complaint || decision.case?.disciplinary_complaint;
		const user = await User.findByPk(userId, { include: [{ association: "roles" }] });

		const placeholders = buildPlaceholders({
			caseData: decision.case,
			complaint,
			decision,
			applicant: complaint?.applicant,
			user,
		});

		const templates = getTemplatesForDecision(decision.status.decision_type).map((t) => ({
			id: t.id,
			title: t.title,
			recipient: t.recipient,
			content: populateTemplate(t.body, placeholders),
		}));

		res.json({ decisionId, decisionType: decision.status.decision_type, templates });
	} catch (err) {
		console.error("getTemplates error:", err);
		errorResponse(res, 500, err.message);
	}
};

/**
 * GET /api/letters/:decisionId
 * Get saved letters for a decision
 */
exports.getLetters = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const letters = await CaseDecisionLetter.findAll({
			where: { case_decision_id: req.params.decisionId },
			include: [{ model: User, as: "creator" }],
			order: [["created_at", "DESC"]],
		});

		res.json({ letters });
	} catch (err) {
		console.error("getLetters error:", err);
		errorResponse(res, 500, err.message);
	}
};

/**
 * GET /api/letters/letter/:letterId
 * Get single letter
 */
exports.getLetter = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const letter = await CaseDecisionLetter.findByPk(req.params.letterId, {
			include: [
				{ model: User, as: "creator" },
				{ model: CaseDecision, as: "decision", include: [{ model: StatusWithAgenda, as: "status" }] },
			],
		});

		if (!letter) return errorResponse(res, 404, "Letter not found");
		res.json({ letter });
	} catch (err) {
		console.error("getLetter error:", err);
		errorResponse(res, 500, err.message);
	}
};

/**
 * POST /api/letters/:decisionId
 * Create letter draft
 */
exports.createLetter = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const { decisionId } = req.params;
		const { letter_type, letter_content } = req.body;

		if (!letter_type || !letter_content) {
			return errorResponse(res, 400, "letter_type and letter_content required");
		}

		const decision = await CaseDecision.findByPk(decisionId);
		if (!decision) return errorResponse(res, 404, "Decision not found");

		const letter = await CaseDecisionLetter.create({
			decision_letter_id: uuidv4(),
			case_decision_id: decisionId,
			letter_type,
			letter_content,
			status: "draft",
			created_by: userId,
		});

		res.status(201).json({ message: "Letter created", letter });
	} catch (err) {
		console.error("createLetter error:", err);
		errorResponse(res, 500, err.message);
	}
};

/**
 * PUT /api/letters/letter/:letterId
 * Update letter draft
 */
exports.updateLetter = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const letter = await CaseDecisionLetter.findByPk(req.params.letterId);
		if (!letter) return errorResponse(res, 404, "Letter not found");
		if (letter.status === "final") return errorResponse(res, 400, "Cannot edit finalized letter");

		await letter.update({ letter_content: req.body.letter_content });
		res.json({ message: "Letter updated", letter });
	} catch (err) {
		console.error("updateLetter error:", err);
		errorResponse(res, 500, err.message);
	}
};

/**
 * POST /api/letters/letter/:letterId/finalize
 * Finalize letter with optional PDF
 */
exports.finalizeLetter = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const letter = await CaseDecisionLetter.findByPk(req.params.letterId);
		if (!letter) return errorResponse(res, 404, "Letter not found");
		if (letter.status === "final") return errorResponse(res, 400, "Already finalized");

		const pdfFile = (req.files || []).find((f) => f.fieldname === "file");
		await letter.update({
			status: "final",
			file_path: pdfFile ? `/uploads/letters/${pdfFile.filename}` : null,
		});

		res.json({ message: "Letter finalized", letter });
	} catch (err) {
		console.error("finalizeLetter error:", err);
		errorResponse(res, 500, err.message);
	}
};

/**
 * DELETE /api/letters/letter/:letterId
 * Delete draft letter
 */
exports.deleteLetter = async (req, res) => {
	try {
		const userId = requireAuth(req, res);
		if (!userId) return;

		const letter = await CaseDecisionLetter.findByPk(req.params.letterId);
		if (!letter) return errorResponse(res, 404, "Letter not found");
		if (letter.status === "final") return errorResponse(res, 400, "Cannot delete finalized letter");

		await letter.destroy();
		res.json({ message: "Letter deleted" });
	} catch (err) {
		console.error("deleteLetter error:", err);
		errorResponse(res, 500, err.message);
	}
};
