/**
 * ለፌዴራል ፖሊስ ኮሚሽን የሚላክ የጉዳይ ማስተላለፊያ ደብዳቤ
 * Case Forwarding Letter to Federal Police Commission
 */

// Formats a date to Amharic locale.
const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'federal_office_forwarding',
	title: 'ለፌዴራል ፖሊስ ኮሚሽን የሚላክ የጉዳይ ማስተላለፊያ ደብዳቤ',
	titleEn: 'Case Forwarding Letter to Federal Police Commission',
	letterType: 'federal_office_forwarding',
	decisionType: 'forward to federal office',
	caseType: 'complaint',

	// Renders the federal office forwarding content.
	getContent: ({ caseNumber, applicantName, decisionDate, decisionStatus, referenceNumber }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr;">
  <p style="text-align: right; margin-bottom: 5px;">ቀን፡ ${formatDate(decisionDate || new Date())}</p>
  <p style="text-align: right; margin-bottom: 30px;">ቁጥር፡ _______________ </p>

  <p style="margin-top: 30px; margin-bottom: 5px;"><strong>ለ፡</strong> የፌዴራል ፖሊስ ኮሚሽን</p>
  <p style="margin-bottom: 30px;"><strong>ጉዳዩ፡</strong> የክስ መዝገብ ቁጥር ${caseNumber || 'N/A'} በተመለከተ</p>

  <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 30px 0; font-size: 16px;">
    የጉዳይ ማስተላለፊያ ደብዳቤ
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    የክስ መዝገብ ቁጥር <strong>${caseNumber || 'N/A'}</strong> በ${formatDate(new Date())} 
    የቀረበ ሲሆን፣ በምክር ቤቱ ተገምግሞ የተሰጠው ውሳኔ <strong>${decisionStatus || 'ውሳኔ'}</strong> ነው።
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    ጉዳዩ በፌዴራል ፖሊስ ኮሚሽን ተጨማሪ እርምጃ እንዲወሰድበት በመምከራችን መሰረት፣ 
    ለእርስዎ ቢሮ እናስተላልፋለን። የጉዳዩን ሰነዶች በሙሉ አባሪ አድርገን እንልካለን።
  </p>

  <p style="text-align: justify; margin-bottom: 20px; line-height: 1.8;">
    ተቀባይነት ማረጋገጫ እና በፌዴራል ደረጃ የሚወሰደውን እርምጃ በጽሁፍ እንዲያሳውቁን 
    በአክብሮት እንጠይቃለን።
  </p>

  <div style="margin-top: 60px;">
    <p style="margin-bottom: 5px;">ከሰላምታ ጋር፣</p>
    <p style="margin-top: 50px; margin-bottom: 5px;">____________________________</p>
    <p style="font-weight: bold; margin-bottom: 5px;">የስራ ኃላፊ</p>
    <p>የዳኞች አስተዳደር ጉባዔ</p>
  </div>
</div>
  `
};

export default template;

