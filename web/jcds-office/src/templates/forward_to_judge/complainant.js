/**
 * ለሰራተኛው የሚላክ ደብዳቤ - ከስራ መሰናበት
 * Letter to Employee - Dismissal
 */

const formatDate = (date) => {
  if (!date) return '';
  // 'am-ET' locale provides the Ethiopian calendar/Amharic script for dates
  return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const template = {
  id: 'disciplinary_dismissal_respondent',
  title: 'ከስራ መሰናበት ውሳኔ ማሳወቂያ',
  titleEn: 'Dismissal Decision Notification',
  letterType: 'employee_letter',
  decisionType: 'dismissal',
  caseType: 'discipline',

  getContent: ({ caseNumber, recipientName, recipientAddress, decisionDate, referenceNumber, appealPeriodDays }) => `
<div style="font-family: 'Nyala', 'Times New Roman', serif; padding: 20px; width: 794px; direction: ltr; margin: 0 auto; background: #fff; border: 1px solid #ddd;">
    <p style="text-align: right; margin-bottom: 5px; font-size: 14px;">ቀን: ${formatDate(decisionDate || new Date())}</p>
    <p style="text-align: right; margin-bottom: 30px; font-size: 14px;">ቁጥር: _____________</p>
    
    <p style="margin-bottom: 5px; font-size: 15px;"><strong>ለ:</strong> ${recipientName || 'ተከሳሽ ሰራተኛ'}</p>
    <p style="margin-bottom: 30px; font-size: 15px;">አድራሻ: ${recipientAddress || 'አድራሻ'}</p>
    
    <p style="text-align: center; font-weight: bold; text-decoration: underline; margin: 25px 0; font-size: 18px;">
        ጉዳዩ፡- የዲሲፕሊን ውሳኔ ማሳወቂያ - መዝገብ ቁጥር ${caseNumber || 'N/A'}
    </p>
    
    <p style="margin-bottom: 15px; font-size: 16px;">ውድ ${(recipientName || 'ሰራተኛ').split(' ')[0]}፣</p>
    
    <p style="text-align: justify; margin-bottom: 15px; line-height: 1.8; font-size: 15px;">
        በእርስዎ ላይ በቀረበው የዲሲፕሊን ክስ መሠረት፣ የዳኞች አስተዳደር ጉባዔ ጉዳይዎን መርምሯል። ጉባዔው ክሱ የቀረበበትን በቂ ማስረጃ መሠረት በማድረግ የሚከተለውን ውሳኔ አስተላልፏል።
    </p>
    
    <p style="text-align: center; margin-bottom: 20px; font-size: 17px;">
        <strong>ውሳኔ: ከስራ መሰናበት።</strong>
    </p>
    
    <p style="text-align: justify; margin-bottom: 30px; line-height: 1.8; font-size: 15px;">
        ይህን ውሳኔ ከተቀበሉበት ቀን ጀምሮ ባሉት ${appealPeriodDays || '30'} ቀናት ውስጥ ይግባኝ የማለት መብትዎ እንደተጠበቀ ነው። ለተጨማሪ ማብራሪያ ወይም ይግባኝ ለማቅረብ አስፈላጊ ከሆነ ወደ ቢሮአችን መምጣት ይችላሉ።
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