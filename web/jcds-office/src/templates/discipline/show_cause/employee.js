/**
 * ለተከሳሽ የሚላክ ደብዳቤ - መልስ እንዲያቀርቡ (Show Cause)
 * Letter to Respondent - Show Cause
 */

// Formats a date to Amharic locale.
const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'disciplinary_show_cause',
	title: 'መልስ እንዲያቀርቡ ጥያቄ',
	titleEn: 'Request for Response (Show Cause)',
	letterType: 'employee_letter',
	decisionType: 'forward to committee',
	decisionSubtype: 'show cause',
	caseType: 'discipline',

	// Renders the show-cause letter content.
	getContent: ({ caseNumber, recipientName, recipientAddress, decisionDate, referenceNumber, responsePeriodDays, details }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr; margin: 0 auto; background: #fff; border: 1px solid #ddd;">
    <p style="text-align: right; margin-bottom: 5px; font-size: 14px;">ቀን: ${formatDate(decisionDate || new Date())}</p>
    <p style="text-align: right; margin-bottom: 30px; font-size: 14px;">ቁጥር: ${referenceNumber || 'TBD'}</p>
    
    <p style="margin-bottom: 5px; font-size: 15px;"><strong>ለ:</strong> ${recipientName || 'ተከሳሽ ሰራተኛ'}</p>
    <p style="margin-bottom: 30px; font-size: 15px;">አድራሻ: ${recipientAddress || 'አድራሻ'}</p>
    
    <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 25px 0; font-size: 18px;">
        ጉዳዩ፡- በዲሲፕሊን ክስ ላይ መልስ እንዲያቀርቡ ጥያቄ - መዝገብ ቁጥር ${caseNumber || 'N/A'}
    </p>
    
    <p style="margin-bottom: 15px; font-size: 16px;">ውድ ${(recipientName || 'ሰራተኛ').split(' ')[0]}፣</p>
    
    <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 15px;">
        በእርስዎ ላይ የቀረበውን የዲሲፕሊን ክስ በተመለከተ፣ ክስ አቅራቢው ያቀረቧቸውን ማስረጃዎች መርምረናል። እርስዎ በበኩልዎ በጉዳዩ ላይ ተገቢውን ምላሽ እና መከላከያ እንዲያቀርቡ እንጠይቃለን።
    </p>
    
    <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 15px;">
        የዲሲፕሊን ክስ የተመሰረተበት ዝርዝር ጉዳይ: ${details || 'የስራ ግዴታን አለመወጣት እና የድርጅቱን ደንብ መጣስ።'}
    </p>
    
    <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8; font-size: 15px;">
        እባክዎን ይህ ደብዳቤ ከደረሰዎበት ቀን ጀምሮ ባሉት ${responsePeriodDays || '10'} የሥራ ቀናት ውስጥ የጽሑፍ ምላሽዎን በሰነድ ይዘው ለጉባዔው ያቅርቡ።
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






