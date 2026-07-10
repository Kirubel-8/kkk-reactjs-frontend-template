import { useState } from "react";
import { FiCheck } from "react-icons/fi";

const AccordionSections = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const sections = [
    {
      heading: "Acceptance of Terms",
      content:
        "By accessing or using the Constitutional Inquiry Platform (the 'Service'), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use the Service. The Service is designed to facilitate the submission, review, and management of constitutional inquiry cases.",
    },

    {
      heading: "Intellectual Property",
      content:
        "All content submitted through the Service remains the intellectual property of the respective parties. The Service provider retains ownership of the platform, including its design, functionality, and underlying software. You may not reproduce, distribute, or create derivative works without prior written permission.",
    },
    {
      heading: "Privacy Policy",
      content:
        "Your use of the Service is governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy. Case-related information may be shared with relevant authorities as required by law.",
    },
  ];

  return (
    <div className="space-y-4 ">
      <div className="space-y-4 ">
        {sections.map((section, index) => (
          <div key={index} className=" rounded-lg overflow-hidden">
            <button
              className={`w-full text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                activeIndex === index ? "bg-indigo-50" : ""
              }`}
              onClick={() => toggleAccordion(index)}
            >
              <div className="flex items-center">
                <FiCheck className="text-green-500 mr-3 flex-shrink-0" />
                <span className="font-light text-base ">{section.heading}</span>
              </div>
              {/* {activeIndex === index ? (
                            <FiChevronUp className="text-gray-500" />
                        ) : (
                            <FiChevronDown className="text-gray-500" />
                        )} */}
            </button>
            <div
              className={`transition-all duration-300 overflow-hidden ${
                activeIndex === index ? "max-h-screen p-4 pb-6" : "max-h-0"
              }`}
            >
              <p className="text-gray-600 text-[13px] leading-relaxed">
                {section.content}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">User Responsibilities</h4>

                <p className="text-blue-900 text-[12px] leading-relaxed">
                    ለሕገ መንግስት ትርጉም አቤቱታ/ጥያቄ/ ጋር ተያይዘው ለቀርቡ የክስ ማመልከቻ/አቤቱታ/ መልስ እና ሌሎች ሰነዶች ትክክለኛነት ለማረጋገጥ የቀረበ ቃለ መሓላ
                    እኔ/ እኛ አመልካች/ቾች በእዚህ አጣሪ ጉባኤ በመዝገብ ቁጥር_________________ ላቀረብኩት/ላቀረብነው/ የሕገ መንግስት ትርጉም አቤቱታ/ጥያቄ/ በየደረጃው ከተሰጡት የፍርድ ቤት ውሳኔዎች ጋር አያይዤ ያቀረብኩት/ያቀረብነው/ የክስ ማመልከቻ/አቤቱታ/ መልስ እና ሌሎች ሰነዶችም ቀደም ሲል ለፍርድ ቤት ያቀረብኩት/ያቀረብነው/ እውነተኛ እና ትክክለኛ ሰነድ ግልባጭ ለእዚሁ አጣሪ ጉባኤ ያቀረብኩ መሆኑ በቃለ መሓላ አረጋግጣለሁ/እናረጋግጣለን/፡፡
                </p>
            </div> */}
    </div>
  );
};

export default AccordionSections;
