// src/components/FAQ.jsx
import { useState } from "react";
import { Card, CardBody, CardFooter, Button } from "@material-tailwind/react";
import { NavLink } from "react-router-dom";

const FAQ = () => {
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleItem = (itemNumber) => {
    setExpandedItem(expandedItem === itemNumber ? null : itemNumber);
  };

  const faqs = [
    {
      question: "ተቋሙ ምን ምን አገልግሎት ይሰጣል?",
      answer: `1.ከማንኛውም ግለሰብ፣ ከቡድኖች እንዲሁም  ከተቋማት የሚቀርቡለትን የሕገ መንግሥት ትርጉም ጥያቄዎች ያጣራል።  2.የቀረበለትን የትርጉም ጥያቄ ከመረመረ በኋላ ትርጉም የማያስፈልገው ከሆነ ውሳኔውን ለአቤቱታ አቅራቢው ያሳውቃል። 3.ትርጉም የሚያስፈልገው ከሆነ የውሳኔ ሃሳቡን፣ ተያያዥ መረጃዎችንና ሰነዶችን በማካተት ለፌዴሬሽን ምክር ቤት ይልካል። `
    },
    {
      question: "በተቋሙ ምን አይነት ጉዳዮች እንደሚታዩ ንገረኝ?",
      answer: "አቤቱታው ስልጣን ባለው ፍ/ቤት ቀርቦ የታየና የጨረሰ ጉዳይ ሲሆን፣ ጉዳዩ በየደረጃው ስልጣን ያለው አስፈፃሚ አካል ጋር ቀርቦ የመጨረሻ ውሳኔ ያገኘ ሲሆን፣ አንድ ሦስተኛ ወይም ከዚያ በላይ በሆኑ የፌዴራል ወይም የክልል ም/ቤት አባላት የሕገ መንግሥት ትርጉም ጥያቄ ሲቀርብ፤ በፌዴራልም ሆነ በክልል አስፈጻሚ አካላት የትርጉም ጥያቄ ሲቀርብ",
    },
    {
      question: "ጉዳያችንን ለጉባዔው በአካል ቀርበን ማስረዳት እንችላለን?",
      answer: "በአካል ቀርቦ ማስረዳት አይቻልም በልዩ ሁኔታ ጉባኤው ጥሪ ካላደረገ በስተቀር",
    },
    {
      question: "የአገልግሎት ክፍያው ምን ያህል ነው?",
      answer: "ለአጣሪ ጉባዔው የሚቀርብ የሕገ መንግሥት ትርጉም ጥያቄ ለጊዜው ከክፍያ ነጻ ነው።",
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <NavLink to="/">
            <Button
              variant="text"
              color="blue"
              className="flex items-center gap-2 text-blue-700 hover:bg-blue-50 rounded-lg px-4 py-2 transition-all duration-300"
              aria-label="Back to Home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Button>
          </NavLink>
        </div>

        <h1 className="text-4xl font-bold text-blue-900 text-center mb-8">በተደጋጋሚ የተጠየቁ ጥያቄዎች</h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="border-l-4 border-blue-900 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardBody
                className="flex justify-between items-center cursor-pointer p-4"
                onClick={() => toggleItem(index + 1)}
              >
                <h3 className="text-lg font-medium text-gray-800">{faq.question}</h3>
                <Button
                  color="blue"
                  variant={expandedItem === index + 1 ? "filled" : "outlined"}
                  size="sm"
                  className="w-10 h-10 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(index + 1);
                  }}
                  aria-label={expandedItem === index + 1 ? "Collapse" : "Expand"}
                >
                  {expandedItem === index + 1 ? "−" : "+"}
                </Button>
              </CardBody>
              <CardFooter
                className={`mt-2 bg-blue-50 p-4 rounded-lg transition-all duration-300 ${
                  expandedItem === index + 1 ? "" : "hidden"
                }`}
              >
                <p className="text-gray-600">{faq.answer}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;