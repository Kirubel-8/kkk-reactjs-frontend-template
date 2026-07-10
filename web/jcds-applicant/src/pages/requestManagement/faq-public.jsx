import React, { useState } from "react";

const FAQPublic = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col items-center w-full pt-[clamp(16px,2vh,24px)] px-[clamp(12px,3vw,24px)]">
      <h1
        className="text-center text-[clamp(24px,3vw,32px)] leading-none tracking-normal mt-[clamp(20px,2.5vh,32px)]"
        style={{
          fontFamily: 'Montserrat',
          fontWeight: 600,
          color: '#073954'
        }}
      >
        Frequently Asked Questions
        </h1>
      <p
        className="text-center max-w-[clamp(320px,45vw,560px)] text-[clamp(14px,1.4vw,16px)] leading-[clamp(18px,2vw,22px)] tracking-normal mt-[clamp(12px,1.5vh,16px)]"
        style={{
          fontFamily: 'Montserrat',
          fontWeight: 500,
          color: '#507386'
        }}
      >
        These are the prerequisites for getting services from Federal Judicial Administration Council Secretariat  (FJACS).
      </p>
      <div className="flex flex-col w-full max-w-[clamp(320px,80vw,960px)] mt-[clamp(20px,3vh,32px)] gap-[clamp(16px,2vh,24px)]">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`w-full rounded-lg pt-[clamp(20px,2.5vh,32px)] pr-[clamp(20px,2.5vw,32px)] pb-[clamp(20px,2.5vh,32px)] pl-[clamp(20px,2.5vw,32px)] gap-[clamp(8px,1.2vh,12px)] bg-white flex flex-col ${
              openIndex === index 
                ? 'shadow-md border-l-4 border-[#215167]' 
                : 'shadow-sm'
            }`}
            style={{
              boxShadow: openIndex === index ? '0px 1px 2px 0px #00000040' : '0px 0px 4px 0px #0000001F'
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-[clamp(8px,1vw,16px)]">
                <span
                  className="text-[clamp(14px,1.4vw,16px)] leading-none tracking-normal text-black"
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: 600
                  }}
                >
                  FAQ   {index + 1}
                </span>
                <span
                  className="text-[clamp(14px,1.4vw,16px)] leading-none tracking-normal text-black"
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: 400
                  }}
                >
                  What is a Disciplinary Case Request?
                </span>
              </div>
        <button
                onClick={() => handleToggle(index)}
                className="w-[clamp(12px,1vw,16px)] h-[clamp(12px,1vw,16px)] flex items-center justify-center flex-shrink-0 bg-transparent border-none cursor-pointer p-0"
        >
                <span className="text-[clamp(18px,2vw,24px)] leading-none font-semibold">
                  {openIndex === index ? '−' : '+'}
                </span>
        </button>
            </div>
            {openIndex === index && (
              <div className="w-full rounded-xl gap-[clamp(12px,1.5vh,16px)] p-[clamp(16px,2vw,20px)] bg-[#F7F7FF] mt-[clamp(8px,1vh,10px)]">
                <div className="w-full max-w-[clamp(320px,70vw,760px)] gap-[clamp(12px,1.5vh,16px)]">
                  <span
                    className="text-[clamp(14px,1.4vw,16px)] leading-[clamp(18px,2vw,22px)] tracking-normal text-black"
                    style={{
                      fontFamily: 'Montserrat',
                      fontWeight: 400
                    }}
                  >
                    Usually supervisors, managers, HR officers, or department heads. Some systems also allow employees to report misconduct anonymously.
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPublic;

