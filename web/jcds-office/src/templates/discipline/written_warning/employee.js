/**
 * ለሰራተኛው የሚላክ ደብዳቤ - የጽሁፍ ማስጠንቀቂያ
 * Letter to Employee - Written Warning
 */

// Formats a date to Amharic locale.
const formatDate = (date) => {
	if (!date) return '';
	return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
	id: 'disciplinary_written_warning',
	title: 'የጽሁፍ ማስጠንቀቂያ',
	titleEn: 'Written Warning',
	letterType: 'employee_letter',
	decisionType: 'complaint closed',
	decisionSubtype: 'written warning',
	caseType: 'discipline',

	// Renders the written-warning letter content.
	getContent: ({ caseNumber, recipientName, recipientAddress, decisionDate, referenceNumber, details, warningLevel }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr; margin: 0 auto; background: #fff; border: 1px solid #ddd;">
    <p style="text-align: right; margin-bottom: 5px; font-size: 14px;">ቀን: ${formatDate(decisionDate || new Date())}</p>
    <p style="text-align: right; margin-bottom: 30px; font-size: 14px;">ቁጥር: ${referenceNumber || 'TBD'}</p>
    
    <p style="margin-bottom: 5px; font-size: 15px;"><strong>ለ:</strong> ${recipientName || 'ሰራተኛው'}</p>
    <p style="margin-bottom: 30px; font-size: 15px;">አድራሻ: ${recipientAddress || 'አድራሻ'}</p>
    
    <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 25px 0; font-size: 18px;">
        ጉዳዩ፡- የጽሁፍ ማስጠንቀቂያ ስለመስጠት - መዝገብ ቁጥር ${caseNumber || 'N/A'}
    </p>
    
    <p style="margin-bottom: 15px; font-size: 16px;">ውድ ${(recipientName || 'ሰራተኛ').split(' ')[0]}፣</p>
    
    <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 15px;">
        በ${formatDate(decisionDate || new Date())} በተሰጠው ውሳኔ መሰረት፣ በሚከተለው ጥፋት ምክንያት የዲሲፕሊን ${warningLevel || 'የመጀመሪያ'} የጽሁፍ ማስጠንቀቂያ ተሰጥቶዎታል።
    </p>
    
    <p style="margin-bottom: 15px; line-height: 1.8; font-size: 15px;">
        <strong>የተፈፀመው ጥፋት:</strong> ${details || 'ያለ በቂ ምክንያት ከስራ ገበታ መቅረት/የስራ ሰዓት ማርፈድ።'}
    </p>
    
    <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8; font-size: 15px;">
        ይህ የጽሑፍ ማስጠንቀቂያ ሲሆን፣ ለወደፊት ተመሳሳይ ወይም ሌላ ጥፋት ከፈጸሙ፣ በጉዳይዎ ላይ ከዚህ የከበደ የዲሲፕሊን ቅጣት የሚጣል መሆኑን እናሳውቃለን።
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



