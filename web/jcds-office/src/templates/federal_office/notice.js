/**
 * ለፌዴራል ፖሊስ ኮሚሽን የሚላክ ደብዳቤ - ጉዳዩ ተጨማሪ ምርመራ እንዲደረግለት
 * Letter to Federal Police Commission - For Further Investigation
 */

// Formats a date to Amharic locale.
const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'federal_office_notice',
	title: 'ለፌዴራል ፖሊስ ኮሚሽን የሚላክ ደብዳቤ - ጉዳዩ ተጨማሪ ምርመራ እንዲደረግለት',
	titleEn: 'Letter to Federal Police Commission - For Further Investigation',
	letterType: 'federal_office_notice',
	decisionType: 'forward to federal office',
	caseType: 'complaint',

	// Renders the federal office notice content.
	getContent: ({ caseNumber, applicantName, decisionDate, decisionStatus, referenceNumber }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr;">
  <p style="text-align: right; margin-bottom: 5px;">ቀን፡ ${formatDate(decisionDate || new Date())}</p>
  <p style="text-align: right; margin-bottom: 30px;">ቁጥር፡ _______________ </p>

  <p style="margin-top: 30px; margin-bottom: 5px;"><strong>ለ፡</strong> የፌዴራል ፖሊስ ኮሚሽን</p>
  <p style="margin-bottom: 30px;"><strong>ጉዳዩ፡</strong> የክስ መዝገብ ቁጥር ${caseNumber || 'N/A'} ተጨማሪ ምርመራ እንዲደረግለት በተመለከተ</p>

  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 30px 0; font-size: 16px;">
    ጉዳዩ ተጨማሪ ምርመራ እንዲደረግለት የሚላክ ደብዳቤ
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    በ${formatDate(new Date())} በአመልካች <strong>${applicantName || 'አመልካች'}</strong> የቀረበው 
    የክስ መዝገብ ቁጥር <strong>${caseNumber || 'N/A'}</strong> በምክር ቤቱ ተመርምሮ በ${formatDate(decisionDate)} 
    ውሳኔ ላይ ደርሷል።
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    የተሰጠው ውሳኔ፡ <strong>${decisionStatus || 'ውሳኔ'}</strong>
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    ጉዳዩ በፌዴራል ደረጃ ተጨማሪ ምርመራ እንዲደረግለት በመምከራችን መሰረት፣ አስፈላጊውን እርምጃ እንዲወስዱ 
    በአክብሮት እንጠይቃለን። የጉዳዩን ሰነዶች በሙሉ አባሪ አድርገን እንልካለን።
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    ተቀባይነት ማረጋገጫ እና የሚወስዱትን እርምጃ በጽሁፍ እንዲያሳውቁን እንጠይቃለን።
  </p>

  <div style="margin-top: 60px;">
    <p style="margin-bottom: 5px;">በአክብሮት፣</p>
    <p style="margin-top: 50px; margin-bottom: 5px;">____________________________</p>
    <p style="font-weight: bold; margin-bottom: 5px;">የስራ ኃላፊ</p>
    <p>የዳኞች አስተዳደር ጉባዔ</p>
  </div>
</div>
  `
};

export default template;

