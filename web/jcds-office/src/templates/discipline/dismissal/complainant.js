/**
 * ለአመልካች የሚላክ ደብዳቤ - ከስራ መሰናበት
 * Letter to Complainant - Dismissal
 */

// Formats a date to Amharic locale.
const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'dismissal_complainant',
	title: 'ለአመልካች የሚላክ ደብዳቤ - ከስራ መሰናበት',
	titleEn: 'Letter to Complainant - Dismissal',
	letterType: 'complainant_letter',
	decisionType: 'complaint closed',
	decisionSubtype: 'dismissal',
	caseType: 'discipline',

	// Renders the dismissal letter content for complainants.
	getContent: ({ caseNumber, applicantName, applicantAddress, decisionDate, referenceNumber }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr;">
  <p style="text-align: right; margin-bottom: 5px;">ቀን: ${formatDate(decisionDate || new Date())}</p>
  <p style="text-align: right; margin-bottom: 30px;">ቁጥር: _____________</p>
  
  <p style="margin-bottom: 5px;"><strong>ለ:</strong> ${applicantName || 'አመልካች'}</p>
  <p style="margin-bottom: 30px;">${applicantAddress || ''}</p>
  
  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 16px;">
    ጉዳዩ፡- የዲሲፕሊን ውሳኔ ማሳወቂያ - መዝገብ ቁጥር ${caseNumber || 'N/A'}
  </p>
  
  <p style="margin-bottom: 15px;">ውድ ${(applicantName || 'አመልካች').split(' ')[0]}፣</p>
  
  <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8;">
    ባቀረቡት አቤቱታ መሰረት የዲሲፕሊን ጉባዔው ጉዳዩን መርምሮ ውሳኔ መስጠቱን እናሳውቃለን።
  </p>
  
  <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8;">
    ውሳኔ: <strong>ከስራ መሰናበት</strong>
  </p>
  
  <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8;">
    ማንኛውም ጥያቄ ካለዎት ወደ ቢሮአችን ይመጡ።
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
