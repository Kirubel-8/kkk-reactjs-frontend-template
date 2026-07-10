// src/components/FAQ.jsx
import { Button, Card, CardBody, CardFooter } from "@material-tailwind/react";
import { useState } from "react";
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';


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
      return value >= 1000 ? `${Math.round(value / 1000)}K` : Math.round(value).toString();
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: index * 0.1,
          duration: 0.6,
          ease: "easeOut"
        }
      }
    };

    const counterVariants = {
      hidden: { scale: 0.8 },
      visible: {
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 10,
          delay: index * 0.1 + 0.3
        }
      }
    };

    console.log(`CounterItem index: ${index}, color: ${index % 2 === 0 ? 'yellow' : '#2D3084'}`);

    return (
      <motion.div
        ref={ref}
        className="p-6 rounded-lg"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={itemVariants}
      >
        <motion.h3
          className={`text-4xl font-bold ${index % 2 === 0 ? 'text-yellow-600' : 'text-blue-600'}`}
          variants={counterVariants}
        >
          {inView ? (
            <CountUp
              end={end}
              duration={2}
              formattingFn={formatNumber}
            />
          ) : '0'}
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

 
 {/* Application Attachment Requirement Section */}
      <div className=" bg-white p-10 rounded-xl shadow-md text-center">
        <h2 className="text-3xl font-semibold text-blue-900 mb-6">
          አቤቱታ ለማቅረብ መሟላት ያለበት ዝርዝር መረጃ
        </h2>
        <p className="text-gray-500 mb-8 text-base md:text-lg text-center">
          Below is the list of document required to apply for the respective services.<br />
          Keeping document handy while applying will help with seamless application experience.
        </p>
        <div className="space-y-4 mx-auto max-w-2xl">
          <Card className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardBody className="flex justify-between items-center cursor-pointer p-4" onClick={() => toggleItem(1)}>
              <h3 className="text-lg font-medium text-gray-700">Number 1: Applicant Information</h3>
              <Button
                color="blue"
                variant={expandedItem === 1 ? "filled" : "outlined"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(1);
                }}
              >
                {expandedItem === 1 ? '-' : '+'}
              </Button>
            </CardBody>
            <CardFooter className={`mt-2 bg-blue-50 p-4 rounded-lg ${expandedItem === 1 ? '' : 'hidden'}`}>
              <p className="text-gray-700 mb-2">Requirements for a new Request</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 1</p>
                  <p className="text-gray-600">Full Name</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 2</p>
                  <p className="text-gray-600">Phone Number</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 3</p>
                  <p className="text-gray-600">Gender</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Optional Documents:</p>
                  <p className="text-gray-600">ID Card</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium"></p>
                  <p className="text-gray-600">Address</p>
                </Card>
              </div>
            </CardFooter>
          </Card>
          <Card className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardBody className="flex justify-between items-center cursor-pointer p-4" onClick={() => toggleItem(2)}>
              <h3 className="text-lg font-medium text-gray-700">Number 2: Representative Attachment</h3>
              <Button
                color="blue"
                variant={expandedItem === 2 ? "filled" : "outlined"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(2);
                }}
              >
                {expandedItem === 2 ? '-' : '+'}
              </Button>
            </CardBody>
            <CardFooter className={`mt-2 bg-blue-50 p-4 rounded-lg ${expandedItem === 2 ? '' : 'hidden'}`}>
              <p className="text-gray-700 mb-2">Requirements for Representative Attachment</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 1</p>
                  <p className="text-gray-600">Representative ID</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 2</p>
                  <p className="text-gray-600">Authorization Letter</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 3</p>
                  <p className="text-gray-600">Contact Details</p>
                </Card>
              </div>
            </CardFooter>
          </Card>
          <Card className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardBody className="flex justify-between items-center cursor-pointer p-4" onClick={() => toggleItem(3)}>
              <h3 className="text-lg font-medium text-gray-700">Number 3: Respondent Attachment</h3>
              <Button
                color="blue"
                variant={expandedItem === 3 ? "filled" : "outlined"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(3);
                }}
              >
                {expandedItem === 3 ? '-' : '+'}
              </Button>
            </CardBody>
            <CardFooter className={`mt-2 bg-blue-50 p-4 rounded-lg ${expandedItem === 3 ? '' : 'hidden'}`}>
              <p className="text-gray-700 mb-2">Requirements for Respondent Attachment</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 1</p>
                  <p className="text-gray-600">Respondent ID</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 2</p>
                  <p className="text-gray-600">Response Statement</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 3</p>
                  <p className="text-gray-600">Contact Information</p>
                </Card>
              </div>
            </CardFooter>
          </Card>
          <Card className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardBody className="flex justify-between items-center cursor-pointer p-4" onClick={() => toggleItem(4)}>
              <h3 className="text-lg font-medium text-gray-700">Number 4: Complaints</h3>
              <Button
                color="blue"
                variant={expandedItem === 4 ? "filled" : "outlined"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(4);
                }}
              >
                {expandedItem === 4 ? '-' : '+'}
              </Button>
            </CardBody>
            <CardFooter className={`mt-2 bg-blue-50 p-4 rounded-lg ${expandedItem === 4 ? '' : 'hidden'}`}>
              <p className="text-gray-700 mb-2">Requirements for Complaints</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 1</p>
                  <p className="text-gray-600">Complaint Form</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 2</p>
                  <p className="text-gray-600">Supporting Evidence</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 3</p>
                  <p className="text-gray-600">Complainant Details</p>
                </Card>
              </div>
            </CardFooter>
          </Card>
          <Card className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardBody className="flex justify-between items-center cursor-pointer p-4" onClick={() => toggleItem(5)}>
              <h3 className="text-lg font-medium text-gray-700">Number 5: Attach Document</h3>
              <Button
                color="blue"
                variant={expandedItem === 5 ? "filled" : "outlined"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(5);
                }}
              >
                {expandedItem === 5 ? '-' : '+'}
              </Button>
            </CardBody>
            <CardFooter className={`mt-2 bg-blue-50 p-4 rounded-lg ${expandedItem === 5 ? '' : 'hidden'}`}>
              <p className="text-gray-700 mb-2">Requirements for Attach Document</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 1</p>
                  <p className="text-gray-600">Scanned Copy of Document</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 2</p>
                  <p className="text-gray-600">Upload Confirmation</p>
                </Card>
              </div>
            </CardFooter>
          </Card>
          <Card className="border-l-4 border-blue-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardBody className="flex justify-between items-center cursor-pointer p-4" onClick={() => toggleItem(6)}>
              <h3 className="text-lg font-medium text-gray-700">Number 6: Review</h3>
              <Button
                color="blue"
                variant={expandedItem === 6 ? "filled" : "outlined"}
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(6);
                }}
              >
                {expandedItem === 6 ? '-' : '+'}
              </Button>
            </CardBody>
            <CardFooter className={`mt-2 bg-blue-50 p-4 rounded-lg ${expandedItem === 6 ? '' : 'hidden'}`}>
              <p className="text-gray-700 mb-2">Requirements for Review</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 1</p>
                  <p className="text-gray-600">Review Checklist</p>
                </Card>
                <Card className="bg-white p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                  <p className="text-gray-700 font-medium">Requirement 2</p>
                  <p className="text-gray-600">Feedback Form</p>
                </Card>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

            };
