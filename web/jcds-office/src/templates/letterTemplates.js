/**
 * Letter Templates Configuration
 *
 * Templates are grouped by caseType/decisionType and filtered as needed.
 * decisionType should mirror backend StatusWithAgenda.decision_type values.
 */

// Import templates
import dismissal_judge from './discipline/dismissal/judge';
import dismissal_complainant from './discipline/dismissal/complainant';
import dismissal_employee from './discipline/dismissal/employee';
import show_cause_employee from './discipline/show_cause/employee';
import written_warning_employee from './discipline/written_warning/employee';
import exoneration_employee from './discipline/exoneration/employee';
import federal_office_notice from './federal_office/notice';
import federal_office_forwarding from './federal_office/forwarding';

// =============================================================================
// ALL AVAILABLE TEMPLATES
// =============================================================================

export const ALL_TEMPLATES = [
	dismissal_judge,
	dismissal_complainant,
	dismissal_employee,
	show_cause_employee,
	written_warning_employee,
	exoneration_employee,
	federal_office_notice,
	federal_office_forwarding,
];

// =============================================================================
// LETTER TYPE LABELS
// =============================================================================

export const LETTER_TYPES = {
	judge_letter: { id: 'judge_letter', translationKey: 'letterGeneration.letterTypes.judgeLetter' },
	complainant_letter: { id: 'complainant_letter', translationKey: 'letterGeneration.letterTypes.complainantLetter' },
	employee_letter: { id: 'employee_letter', translationKey: 'letterGeneration.letterTypes.employeeLetter' },
	internal_memo: { id: 'internal_memo', translationKey: 'letterGeneration.letterTypes.internalMemo' },
	federal_office_notice: { id: 'federal_office_notice', translationKey: 'letterGeneration.letterTypes.federalOfficeNotice' },
	federal_office_forwarding: { id: 'federal_office_forwarding', translationKey: 'letterGeneration.letterTypes.federalOfficeForwarding' },
};

// =============================================================================
// REGISTRY + HELPERS
// =============================================================================

// TODO: Align decisionSubtype values to precise backend decision_type once added.
export const TEMPLATE_REGISTRY = ALL_TEMPLATES.reduce((acc, template) => {
	const { caseType, decisionType } = template;
	if (!caseType || !decisionType) return acc;
	if (!acc[caseType]) acc[caseType] = {};
	if (!acc[caseType][decisionType]) acc[caseType][decisionType] = [];
	acc[caseType][decisionType].push(template);
	return acc;
}, {});

/**
 * Get all available templates.
 */
export const getAllTemplates = () => ALL_TEMPLATES;

/**
 * Get a specific template by ID.
 */
export const getTemplateById = (templateId) => ALL_TEMPLATES.find((t) => t.id === templateId) || null;

/**
 * Get templates filtered by caseType, decisionType, and/or letterType.
 */
export const getTemplates = ({ caseType, decisionType, letterType } = {}) =>
	ALL_TEMPLATES.filter((template) => {
		if (caseType && template.caseType !== caseType) return false;
		if (decisionType && template.decisionType !== decisionType) return false;
		if (letterType && template.letterType !== letterType) return false;
		return true;
	});

/**
 * Legacy helper kept for backward compatibility; filters by decisionType only.
 */
export const getTemplatesForDecision = (decisionType) => getTemplates({ decisionType });
