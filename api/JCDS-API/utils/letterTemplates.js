/**
 * Letter Templates Configuration
 * 
 * HOW TO ADD A NEW TEMPLATE:
 * 1. Add template to TEMPLATES object with: id, title, recipient, body
 * 2. Map decision_type to template id(s) in DECISION_TYPE_MAP
 * 
 * PLACEHOLDERS: Use {{field_name}} syntax. Available fields auto-generated from case data.
 */

// =============================================================================
// TEMPLATES - Add new templates here
// =============================================================================

const TEMPLATES = {
	complainant_notice: {
		id: "complainant_notice",
		title: "Complaint Resolution Notice",
		recipient: "complainant",
		body: `
<div style="font-family: 'Times New Roman', serif; padding: 20px; max-width: 700px;">
  <p style="text-align: right;">Date: {{current_date}}</p>
  <p style="text-align: right;">Ref: {{reference_number}}</p>
  
  <p style="margin-top: 30px;"><strong>To:</strong> {{applicant_name}}<br/>{{applicant_address}}</p>
  
  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0;">
    RE: Resolution of Your Complaint - Case No. {{case_number}}
  </p>
  
  <p>Dear {{applicant_name}},</p>
  
  <p style="text-align: justify;">
    We acknowledge receipt of your complaint filed on <strong>{{complaint_date}}</strong>.
    After careful review, the Council has determined: <strong>{{decision_status}}</strong>.
  </p>
  
  <p style="text-align: justify;">
    If you have questions, please contact our office.
  </p>
  
  <p style="margin-top: 40px;">Respectfully,</p>
  <div style="margin-top: 50px;">
    <p>____________________________</p>
    <p><strong>{{signatory_name}}</strong><br/>{{signatory_title}}</p>
  </div>
</div>`,
	},

	judge_forwarding: {
		id: "judge_forwarding",
		title: "Case Forwarding to Court",
		recipient: "judge",
		body: `
<div style="font-family: 'Times New Roman', serif; padding: 20px; max-width: 700px;">
  <p style="text-align: right;">Date: {{current_date}}</p>
  <p style="text-align: right;">Ref: {{reference_number}}</p>
  
  <p style="margin-top: 30px;"><strong>To:</strong> The Honorable Judge<br/>{{court_name}}</p>
  
  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0;">
    RE: Forwarding of Case No. {{case_number}}
  </p>
  
  <p>Dear Honorable Judge,</p>
  
  <p style="text-align: justify;">
    This letter formally forwards Case No. <strong>{{case_number}}</strong> 
    filed by <strong>{{applicant_name}}</strong> on {{complaint_date}} 
    for judicial consideration.
  </p>
  
  <p style="margin-top: 40px;">Respectfully submitted,</p>
  <div style="margin-top: 50px;">
    <p>____________________________</p>
    <p><strong>{{signatory_name}}</strong><br/>{{signatory_title}}</p>
  </div>
</div>`,
	},

	internal_memo: {
		id: "internal_memo",
		title: "Internal Forwarding Memo",
		recipient: "internal",
		body: `
<div style="font-family: 'Times New Roman', serif; padding: 20px; max-width: 700px;">
  <p style="text-align: right;">Date: {{current_date}}</p>
  <p style="text-align: right;">Ref: {{reference_number}}</p>
  
  <p style="margin-top: 30px;"><strong>To:</strong> {{recipient_office}}</p>
  
  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0;">
    RE: Case Forwarding - Case No. {{case_number}}
  </p>
  
  <p style="text-align: justify;">
    Case No. <strong>{{case_number}}</strong> is hereby forwarded for review per decision dated {{decision_date}}.
  </p>
  
  <div style="margin-top: 30px;">
    <p>Submitted by,<br/><strong>{{signatory_name}}</strong></p>
  </div>
</div>`,
	},

  federal_office_notice: {
    id: "federal_office_notice",
    title: "ለፌዴራል ፖሊስ ኮሚሽን የሚላክ ደብዳቤ - ጉዳዩ ተጨማሪ ምርመራ እንዲደረግለት",
    recipient: "federal_office",
    body: `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; max-width: 700px; line-height: 1.8;">
  <p style="text-align: right; margin-bottom: 5px;">ቀን፡ {{current_date}}</p>
  <p style="text-align: right; margin-bottom: 30px;">ቁጥር፡ _____________</p>

  <p style="margin-top: 30px; margin-bottom: 5px;"><strong>ለ፡</strong> የፌዴራል ፖሊስ ኮሚሽን</p>
  <p style="margin-bottom: 30px;"><strong>ጉዳዩ፡</strong> የክስ መዝገብ ቁጥር {{case_number}} ተጨማሪ ምርመራ እንዲደረግለት በተመለከተ</p>

  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 30px 0; font-size: 16px;">
    ጉዳዩ ተጨማሪ ምርመራ እንዲደረግለት የሚላክ ደብዳቤ
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    በ<strong>{{complaint_date}}</strong> በአመልካች <strong>{{applicant_name}}</strong> የቀረበው 
    የክስ መዝገብ ቁጥር <strong>{{case_number}}</strong> በምክር ቤቱ ተመርምሮ በ<strong>{{decision_date}}</strong> 
    ውሳኔ ላይ ደርሷል።
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    የተሰጠው ውሳኔ፡ <strong>{{decision_status}}</strong>
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    ጉዳዩ በፌዴራል ደረጃ ተጨማሪ ምርመራ እንዲደረግለት በመምከራችን መሰረት፣ አስፈላጊውን እርምጃ እንዲወስዱ 
    በአክብሮት እንጠይቃለን። የጉዳዩን ሰነዶች በሙሉ አባሪ አድርገን እንልካለን።
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    ተቀባይነት ማረጋገጫ እና የሚወስዱትን እርምጃ በጽሁፍ እንዲያሳውቁን እንጠይቃለን።
  </p>

  <div style="margin-top: 60px;">
    <p style="margin-bottom: 5px;">በአክብሮት፣</p>
    <p style="margin-top: 50px; margin-bottom: 5px;">____________________________</p>
    <p style="margin-bottom: 3px;"><strong>{{signatory_name}}</strong></p>
    <p>{{signatory_title}}</p>
  </div>
</div>`,
  },

  federal_office_forwarding: {
    id: "federal_office_forwarding",
    title: "ለፌዴራል ፖሊስ ኮሚሽን የሚላክ የጉዳይ ማስተላለፊያ ደብዳቤ",
    recipient: "federal_office",
    body: `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; max-width: 700px; line-height: 1.8;">
  <p style="text-align: right; margin-bottom: 5px;">ቀን፡ {{current_date}}</p>
  <p style="text-align: right; margin-bottom: 30px;">ቁጥር፡ _____________</p>

  <p style="margin-top: 30px; margin-bottom: 5px;"><strong>ለ፡</strong> የፌዴራል ፖሊስ ኮሚሽን</p>
  <p style="margin-bottom: 30px;"><strong>ጉዳዩ፡</strong> የክስ መዝገብ ቁጥር {{case_number}} በተመለከተ</p>

  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 30px 0; font-size: 16px;">
    የጉዳይ ማስተላለፊያ ደብዳቤ
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    የክስ መዝገብ ቁጥር <strong>{{case_number}}</strong> በ<strong>{{complaint_date}}</strong> 
    የቀረበ ሲሆን፣ በምክር ቤቱ ተገምግሞ የተሰጠው ውሳኔ <strong>{{decision_status}}</strong> ነው።
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    ጉዳዩ በፌዴራል ፖሊስ ኮሚሽን ተጨማሪ እርምጃ እንዲወሰድበት በመምከራችን መሰረት፣ 
    ለእርስዎ ቢሮ እናስተላልፋለን። የጉዳዩን ሰነዶች በሙሉ አባሪ አድርገን እንልካለን።
  </p>

  <p style="text-align: justify; margin-bottom: 20px;">
    ተቀባይነት ማረጋገጫ እና በፌዴራል ደረጃ የሚወሰደውን እርምጃ በጽሁፍ እንዲያሳውቁን 
    በአክብሮት እንጠይቃለን።
  </p>

  <div style="margin-top: 60px;">
    <p style="margin-bottom: 5px;">ከሰላምታ ጋር፣</p>
    <p style="margin-top: 50px; margin-bottom: 5px;">____________________________</p>
    <p style="margin-bottom: 3px;"><strong>{{signatory_name}}</strong></p>
    <p>{{signatory_title}}</p>
  </div>
</div>`,
  },
};

// =============================================================================
// DECISION TYPE MAPPING - Map decision_type -> template id(s)
// =============================================================================

const DECISION_TYPE_MAP = {
	"complaint closed": ["complainant_notice"],
	"forward to judge": ["judge_forwarding", "complainant_notice"],
	"forward to council office": ["internal_memo"],
	"back to committee": ["internal_memo"],
	"back to council": ["internal_memo"],
	"forward to committee": ["internal_memo"],
	"forward to council": ["internal_memo"],
  "forward to federal office": ["federal_office_notice", "federal_office_forwarding"],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format date consistently
 */
const formatDate = (date) => {
	if (!date) return "N/A";
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

/**
 * Build all placeholder values from case data
 */
const buildPlaceholders = ({ caseData, complaint, decision, applicant, user }) => ({
	// Dates
	current_date: formatDate(new Date()),
	complaint_date: formatDate(complaint?.createdAt),
	decision_date: formatDate(decision?.createdAt),

	// Case Info
	case_number: caseData?.case_number || "N/A",
	reference_number: decision?.letterRef?.reference_number || "TBD",

	// Applicant
	applicant_name: [applicant?.first_name, applicant?.last_name].filter(Boolean).join(" ") || "Applicant",
	applicant_address: applicant?.address || "",
	applicant_phone: applicant?.phone_no || "",

	// Decision
	decision_status: decision?.status?.name || "Pending",
	decision_type: decision?.status?.decision_type || "",

	// Signatory
	signatory_name: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Authorized Signatory",
	signatory_title: user?.role?.name || "Council Member",

	// Misc
	court_name: "[Court Name]",
	recipient_office: "Disciplinary Council Office",
});

/**
 * Replace all {{placeholders}} in template
 */
const populateTemplate = (body, data) => {
	return body.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
};

/**
 * Get templates for a decision type
 */
const getTemplatesForDecision = (decisionType) => {
	const ids = DECISION_TYPE_MAP[decisionType] || [];
	return ids.map((id) => TEMPLATES[id]).filter(Boolean);
};

/**
 * Get a single template by ID
 */
const getTemplateById = (id) => TEMPLATES[id] || null;

/**
 * List all available templates
 */
const listTemplates = () => Object.values(TEMPLATES).map(({ id, title, recipient }) => ({ id, title, recipient }));

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
	TEMPLATES,
	DECISION_TYPE_MAP,
	formatDate,
	buildPlaceholders,
	populateTemplate,
	getTemplatesForDecision,
	getTemplateById,
	listTemplates,
};
