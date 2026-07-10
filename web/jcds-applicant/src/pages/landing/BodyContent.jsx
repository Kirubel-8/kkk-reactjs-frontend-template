import { Button, Card, CardBody, CardFooter } from "@material-tailwind/react";
import { useState } from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

const BodyContent = () => {
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleItem = (itemNumber) => {
    setExpandedItem(expandedItem === itemNumber ? null : itemNumber);
  };
  const CounterItem = ({ end, label, index }) => {
    const [ref, inView] = useInView({
      triggerOnce: true,
      threshold: 0.3,
    });

    const formatNumber = (value) => {
      return value >= 1000
        ? `${Math.round(value / 1000)}K`
        : Math.round(value).toString();
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: index * 0.1,
          duration: 0.6,
          ease: "easeOut",
        },
      },
    };

    const counterVariants = {
      hidden: { scale: 0.8 },
      visible: {
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 10,
          delay: index * 0.1 + 0.3,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className="p-6 rounded-lg"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={itemVariants}
      >
        <motion.h3
          className={`text-4xl font-bold ${
            index % 2 === 0 ? "text-yellow-600" : "text-blue-600"
          }`}
          variants={counterVariants}
        >
          {inView ? (
            <CountUp end={end} duration={2} formattingFn={formatNumber} />
          ) : (
            "0"
          )}
        </motion.h3>
        <motion.p
          className="text-gray-700 mt-2 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.5 }}
        >
          {label}
        </motion.p>
      </motion.div>
    );
  };

  const CounterGrid = () => {
    const counterItems = [
      { end: 28000, label: "Total Users" },
      { end: 13000, label: "Lifetime Downloads" },
      { end: 68000, label: "Social Reach" },
      { end: 10000, label: "5-Star Reviews" },
    ];

    return (
      <div
        className="bg-[url('/img/background1.png')] bg-cover bg-center bg-opacity-50 grid grid-cols-2 md:grid-cols-4 gap-8  text-center p-10"
        style={{ backgroundColor: "#F2FBFA" }}
      >
        {counterItems.map((item, index) => (
          <CounterItem
            key={index}
            end={item.end}
            label={item.label}
            index={index}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Features Section */}
      <div className=" bg-white p-10 rounded-xl shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-semibold text-blue-900 mb-6 leading-tight">
              የሞባይል መተግበሪያ
            </h2>
            <p className="text-gray-600 mb-8 text-base md:text-lg">
             እነዚህን መተግበሪያዎቸን በመጠቀም ካሉበት ቦታ ሆነው አቤቱታ ማቅረብ፣ ያቀረቡትን አቤቱታ ምን ላይ እንደደረስ መከታተል እንዲሁም የውሳኔ ግልባጭ መውሰድ ይችላሉ።

    
            </p>
            <div className="flex justify-center lg:justify-start space-x-6">
              <img
                src="/cfms-customer/img/appstore.png"
                alt="App Store"
                className="w-28 h-auto transition-transform hover:scale-105"
              />
              <img center 
                src="/cfms-customer/img/playstore.png"
                alt="Google Play"
                className="w-28 h-auto transition-transform hover:scale-105"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/cfms-customer/img/landingmobile.png"
              alt="Phone Mockup"
              className="w-2/3 h-auto object-contain rounded-lg shadow-md"
            />
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-end -mr-10 lg:-mr-10">
            <img
              src="/cfms-customer/img/lanading2.png"
              alt="Dashboard Illustration"
              className="w-3/4 h-auto object-contain rounded-lg shadow-md"
            />
          </div>
          <div className="text-center lg:text-right">
            <h2 className="text-2xl font-semibold text-blue-600 mb-4 leading-tight">
               የሕገ መንግሥት ትርጉም አቤቱታ ለማቅረብ የሚያስፈልጉ መስፈርት
            </h2>
           <p className="text-3x1 text-gray-500 mb-8 text-base md:text-lg text-center">
              አዲስ መዝገብ/ ፋይል ለማስከፈት ከሕገ መንግሥት ትርጉም አቤቱታው ጋር ተያይዘው የሚቀርቡ አባሪዎች፡ 
            </p>
           <p className="text-3x1 text-gray-500 mb-8 text-base md:text-lg text-left">
                ሀ) ለትርጉም ጥያቄው መነሻ የሆነው የፍ/ቤት ውሳኔ በሆነ ጊዜ በፍ/ቤት ማሕተም የተረጋገጠ፡- ይያያዛሉ፣<br></br>

                  በስር ፍ/ቤት የቀረበው ክስ እና መልስ

                  በየደረጃው ያሉ ፍ/ቤቶች የሰጡት ውሳኔዎች<br></br>

            
              ለ) ለትርጉም ጥያቄው መነሻ የሆነው የባለስልጣን ውሳኔ በሆነ ጊዜ በየደረጃው የተሰጡት የባለስልጣን ውሳኔዎች ይያያዛሉ፣<br></br>

              ሐ) በውክልና ለሚቀርብ አቤቱታ የውክልና ስልጣን የሚገልጽ ሰነድ መኖር አለበት፡፡<br></br>

              መ) ለሕገ መንግሥት ትርጉም የሚቀርብ አቤቱታ በፌዴራል መንግሥቱ የሥራ ቋንቋ ተዘጋጅቶ ሊቀርብ ይገባል፡፡ ከፌዴራል
                  መንግሥቱ የሥራ ቋንቋ ውጭ የሆነ ይዘት ያላቸው ውሳኔዎችእና አባሪ ማስረጃዎች በፌዴራሉ መንግሥት የሥራ ቋንቋ ተተርጉመው እና ተረጋግጠው ሊቀርቡ ይገባል
                </p>
            
          </div>
        </div>
      </div>

      <CounterGrid />

      {/* Application Attachment Requirement Section */}
      <div className=" bg-white p-10 rounded-xl shadow-md text-center">
        <h2 className="text-3xl font-semibold text-blue-900 mb-6">
          የሕገ መንግሥት ትርጉም አቤቱታ ለማቅረብ የሚያስፈልጉ መስፈርት
        </h2>
        <p className="text-gray-500 mb-8 text-base md:text-lg text-center">
          አዲስ አቤቱታ ለማቅረብ ከታች ያለዉን መረጃ መሙላት ይኖርባችዋል፦

          
        </p>
        <div className="space-y-4 mx-auto max-w-2xl">
          <div className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => toggleItem(1)}
            >
              <h3 className="text-lg font-medium text-gray-700">
                1: የአመልካች መረጃ
              </h3>
              
            </div>
            <div
              className={`mt-2 bg-blue-50 p-4 rounded-lg ${
                expandedItem === 1 ? "" : "hidden"
              }`}
            >
              <p className="paddind-20px text-3x1 text-gray-700 mb-8 text-base md:text-lg text-left">
              {/* <p className="text-gray-700 mb-2"> */}
                1.የአመልካች ሙሉ ስም<br></br> 2.የአመልካች ስልክ ቁጥር <br></br>  3.የመጡበት ክልል<br></br>  4.የመጡበት ዞን <br></br> 5.የመጡበት ወረዳ <br></br> 6.ጾታ<br></br>  7.የመታወቂያ አይነት(ለምሳሌ የቀበሌ፣ ቤሔራዊ መታወቂያ ...)<br></br>  8.የመታወቂያው የፊት ገጽ ማያያዝ ይኖርቦታል<br></br>  9.የመታወቂያው የጀርባ ገጽ ማያያዝ ይኖርቦታል
              </p>
              {/* <div className="grid grid-cols-1 md:grid-cols gap-4">
                
                  
              
              </div> */}
            </div>
          </div>
          <div className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => toggleItem(2)}
            >
              <h3 className="text-lg font-medium text-gray-700">
                2: የተወካይ መረጃ
              </h3>
              
            </div>
            <div
              className={`mt-2 bg-blue-50 p-4 rounded-lg ${
                expandedItem === 2 ? "" : "hidden"
              }`}
            >
              <p className="paddind-20px text-3x1 text-gray-700 mb-8 text-base md:text-lg text-left">
              {/* <p className="text-gray-700 mb-2"> */}
                1.የተወካይ ሙሉ ስም<br></br> 2.የተወካይ ስልክ ቁጥር <br></br> 3.ጾታ<br></br>  4.የመታወቂያ አይነት(ለምሳሌ:- የቀበሌ፣ ቤሔራዊ መታወቂያ ...)<br></br>  5.የመታወቂያው የፊት ገጽ ማያያዝ ይኖርቦታል<br></br>  6.የመታወቂያው የጀርባ ገጽ ማያያዝ ይኖርቦታል <br></br>7.የውክልና ደብዳቤ
              </p>
              
            </div>
          </div>
          <div className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => toggleItem(3)}
            >
              <h3 className="text-lg font-medium text-gray-700">
                3: የተጠሪ መረጃ
              </h3>
              
            </div>
            <div
              className={`mt-2 bg-blue-50 p-4 rounded-lg ${
                expandedItem === 3 ? "" : "hidden"
              }`}
            >
              <p className="paddind-20px text-3x1 text-gray-700 mb-8 text-base md:text-lg text-left">
              {/* <p className="text-gray-700 mb-2"> */}
                1.የተጠሪ ሙሉ ስም<br></br> 2.የተጠሪ ስልክ ቁጥር <br></br>  3.የተጠሪ አድራሻ<br></br>  4.ከአንድ በላይ ከሆኑ ተጨማሪ የሚለውን በመንካት መጨመር ይችላሉ
              </p>
              
            </div>
          </div>
          <div className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => toggleItem(4)}
            >
              <h3 className="text-lg font-medium text-gray-700">
                4: አቤቱታዎች
              </h3>
              
            </div>
            <div
              className={`mt-2 bg-blue-50 p-4 rounded-lg ${
                expandedItem === 4 ? "" : "hidden"
              }`}
            >
              <p className="paddind-20px text-3x1 text-gray-700 mb-8 text-base md:text-lg text-left">
              {/* <p className="text-gray-700 mb-2"> */}
                1.የፍርድ ቤቱ መዝገብ ቁጥር <br></br> 2.የጉዳዩ(የቅሬታው) አይነት <br></br>  3.ተጥሷል የሚሉት የሕገ መንግስት አንቀጽ<br></br>  4.ስለ ቅሬታዎ ማብራሪያ <br></br> 5.ሌሎች ህጎች እና ሕገ መንግሥታዊ አቤቱታ ማጠቃለያ <br></br> 6.ሕገ መንግሥታዊ አቤቱታ ማጠቃለያ<br></br>  
              </p>
              
            </div>
          </div>
          <div className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => toggleItem(5)}
            >
              <h3 className="text-lg font-medium text-gray-700">
                5: የሚያያዙ አባሪዎች
              </h3>
              
            </div>
            <div
              className={`mt-2 bg-blue-50 p-4 rounded-lg ${
                expandedItem === 5 ? "" : "hidden"
              }`}
            >
              <p className="paddind-20px text-3x1 text-gray-700 mb-8 text-base md:text-lg text-left">
              1. ከታች ፍርድ ቤት ጀምሮ እስከ መጨረሻ ውሳኔ ድረስ ያሉትን ሰነዶች በቅደም ተከተል ማያያዝ ይኖርቦታል 
                {/* 1.የአመልካች ሙሉ ስም<br></br> 2.የአመልካች ስልክ ቁጥር <br></br>  3.የመጡበት ክልል<br></br>  4.የመጡበት ዞን <br></br> 5.የመጡበት ወረዳ <br></br> 6.ጾታ<br></br>  7.የመታወቂያ አይነት(ለምሳሌ የቀበሌ፣ ቤሔራዊ መታወቂያ ...)<br></br>  8.የመታወቂያው የፊት ገጽ ማያያዝ ይኖርቦታል<br></br>  9.የመታወቂያው የጀርባ ገጽ ማያያዝ ይኖርቦታል */}
              </p>
              
            </div>
          </div>
          <div className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => toggleItem(6)}
            >
              <h3 className="text-lg font-medium text-gray-700">
                6: ከላይ የሞሉትን መረጃ የሚያጣሩበት
              </h3>
              
            </div>
            <div
              className={`mt-2 bg-blue-50 p-4 rounded-lg ${
                expandedItem === 6 ? "" : "hidden"
              }`}
            >
              <p className="paddind-20px text-3x1 text-gray-700 mb-8 text-base md:text-lg text-left">
                ከላይ የሞሉትን መረጃ ልክ ከሆነ የተቋሙን ደንብና ግዴታዎችን በመቀበል አቤቱታውን መላክ ይችላሉ
              {/* <p className="text-gray-700 mb-2"> */}
                {/* 1.የአመልካች ሙሉ ስም<br></br> 2.የአመልካች ስልክ ቁጥር <br></br>  3.የመጡበት ክልል<br></br>  4.የመጡበት ዞን <br></br> 5.የመጡበት ወረዳ <br></br> 6.ጾታ<br></br>  7.የመታወቂያ አይነት(ለምሳሌ የቀበሌ፣ ቤሔራዊ መታወቂያ ...)<br></br>  8.የመታወቂያው የፊት ገጽ ማያያዝ ይኖርቦታል<br></br>  9.የመታወቂያው የጀርባ ገጽ ማያያዝ ይኖርቦታል */}
              </p>
              
            </div>
          </div>
         
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="my-16 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center mb-4">
          <p className="text-gray-500 text-sm uppercase tracking-wide">
           
          </p>
          <h2 className="text-4xl font-semibold text-blue-900 mb-8 leading-tight">
           ስለ አገልግሎታችን የተሰጡ አስተያየቶች
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <img
              src="/cfms-customer/img/profile1.png"
              alt="Client Logo 1"
              className="w-16 h-16 mx-auto mb-4 rounded-full object-contain"
            />
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-700 italic mb-4 text-base">
              "OMG! I cannot believe that I have got a brand new landing page
              after getting appmax. It was super easy to edit and publish."
            </p>
            <p className="text-blue-900 font-medium">
             
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <img
              src="/cfms-customer/img/profile1.png"
              alt="Client Logo 2"
              className="w-16 h-16 mx-auto mb-4 rounded-full object-contain"
            />
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-700 italic mb-4 text-base">
              "OMG! I cannot believe that I have got a brand new landing page
              after getting appmax. It was super easy to edit and publish."
            </p>
            <p className="text-blue-900 font-medium">
             
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
            <img
              src="/cfms-customer/img/profile1.png"
              alt="Client Logo 3"
              className="w-16 h-16 mx-auto mb-4 rounded-full object-contain"
            />
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-700 italic mb-4 text-base">
              "OMG! I cannot believe that I have got a brand new landing page
              after getting appmax. It was super easy to edit and publish."
            </p>
            <p className="text-blue-900 font-medium">
              
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BodyContent;
