/**
 * ለዳኛ የሚላክ ደብዳቤ - ከስራ መሰናበት
 * Letter to Judge - Dismissal
 */

const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'forward_to_judge_judge',
	title: 'ለዳኛ የሚላክ ደብዳቤ',
	titleEn: 'Letter to Judge',
	letterType: 'judge_letter',
	decisionType: 'forward to judge',
	caseType: 'discipline',

	getContent: ({ caseNumber, applicantName, decisionDate, decisionStatus, referenceNumber }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr;">
  <p style="text-align: right; margin-bottom: 5px;">ቀን: ${formatDate(decisionDate || new Date())}</p>
  <p style="text-align: right; margin-bottom: 30px;">ቁጥር: _______________ </p>
  
  <p style="margin-bottom: 30px;"><strong>ለክቡር ዳኛ</strong></p>
  
  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 16px;">
    ጉዳዩ፡- የዲሲፕሊን ውሳኔ ማሳወቂያ - መዝገብ ቁጥር ${caseNumber || 'N/A'}
  </p>
  
  <p style="margin-bottom: 15px;">ክቡር ዳኛ፣</p>
  
  <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8;">
    በ<strong>${applicantName || 'አመልካች'}</strong> ላይ የቀረበውን የዲሲፕሊን ጉዳይ መርምረን ውሳኔ መስጠታችንን እናሳውቃለን።
  </p>
  
  <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8;">
    ውሳኔ: <strong>ከስራ መሰናበት</strong>
  </p>
  
  <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8;">
    ይህ ደብዳቤ ለመዝገብ እንዲቀመጥ ተልኳል።
  </p>
  
  <p style="margin-top: 40px; margin-bottom: 5px;">በአክብሮት፣</p>
  
  <div style="margin-top: 60px;">
    <p style="margin-bottom: 5px;">____________________________</p>
    <p style="font-weight: bold; margin-bottom: 5px;">የስራ ኃላፊ</p>
    <p>የዳኞች አስተዳደር ጉባዔ</p>
  </div>
</div>
  `
};

export default template;
