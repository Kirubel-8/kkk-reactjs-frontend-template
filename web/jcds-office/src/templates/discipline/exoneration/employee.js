/**
 * ለሰራተኛው የሚላክ ደብዳቤ - ከክስ ነፃ (Exoneration)
 * Letter to Employee - Exoneration/Acquittal
 */

// Formats a date to Amharic locale.
const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'disciplinary_exoneration',
	title: 'ከክስ ነፃ መሆን ማሳወቂያ',
	titleEn: 'Acquittal/Exoneration Notification',
	letterType: 'employee_letter',
	decisionType: 'complaint closed',
	decisionSubtype: 'exonerated/no sanction',
	caseType: 'discipline',

	// Renders the exoneration letter content.
	getContent: ({ caseNumber, recipientName, recipientAddress, decisionDate, referenceNumber }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr; margin: 0 auto; background: #fff; border: 1px solid #ddd;">
    <p style="text-align: right; margin-bottom: 5px; font-size: 14px;">ቀን: ${formatDate(decisionDate || new Date())}</p>
    <p style="text-align: right; margin-bottom: 30px; font-size: 14px;">ቁጥር: ________________ </p>
    
    <p style="margin-bottom: 5px; font-size: 15px;"><strong>ለ:</strong> ${recipientName || 'ሰራተኛው'}</p>
    <p style="margin-bottom: 30px; font-size: 15px;">አድራሻ: ${recipientAddress || 'አድራሻ'}</p>
    
    <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 25px 0; font-size: 18px;">
        ጉዳዩ፡- የዲሲፕሊን ውሳኔ ማሳወቂያ - መዝገብ ቁጥር ${caseNumber || 'N/A'}
    </p>
    
    <p style="margin-bottom: 15px; font-size: 16px;">ውድ ${(recipientName || 'ሰራተኛ').split(' ')[0]}፣</p>
    
    <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 15px;">
        በእርስዎ ላይ በቀረበው የዲሲፕሊን ክስ መሠረት፣ የዳኞች አስተዳደር ጉባዔ ጉዳይዎን መርምሮ ውሳኔ አስተላልፏል። 
    </p>
    
    <p style="text-align: center; margin-bottom: 20px; font-size: 17px;">
        <strong>ውሳኔ: ከክስ ነፃ (አያስቀጣም)።</strong>
    </p>
    
    <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8; font-size: 15px;">
        ጉባዔው ያቀረቧቸውን ማስረጃዎች በመመርመር፣ የቀረበው ክስ ውድቅ መደረጉን እና በጉዳዩ ላይ ከማንኛውም ቅጣት ነጻ መሆንዎን እናሳውቃለን። ይህ ውሳኔ ከዛሬ ጀምሮ ተግባራዊ ይሆናል።
    </p>
    
    <p style="margin-top: 40px; margin-bottom: 5px; font-size: 15px;">በአክብሮት፣</p>
    
    <div style="margin-top: 60px;">
        <p style="margin-bottom: 5px;">____________________________</p>
        <p style="font-weight: bold; margin-bottom: 5px; font-size: 15px;">የስራ ኃላፊ</p>
        <p style="font-size: 14px;">የዳኞች አስተዳደር ጉባዔ</p>
    </div>
</div>
  `
};

export default template;



