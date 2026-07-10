import requestService from "@/service/request.service";
import {
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@material-tailwind/react";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const slideUp = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    setHasSearched(true);
    setSearchResults([]);

    try {
      const response = await requestService.searchRequests(searchQuery);
      setSearchResults(response?.requests || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, [searchQuery]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen bg-[url('/img/background1.png')] bg-cover bg-center bg-opacity-50 flex flex-col justify-center"
      style={{ backgroundColor: '#F2FBFA' }}
    >
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            className="lg:w-2/5 text-center lg:text-left"
            variants={containerVariants}
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl font-bold text-blue-900 mb-6 leading-tight"
            >
              የአቤቱታ ጉዳዮች አስተዳደር ስርዓት
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-gray-700 mb-8 text-sm md:text-lg"
            >
              በተሰጦት መለያ ቁጥር መፈለግ ይችላሉ።
            </motion.p>

            <motion.form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 max-w-2xl w-full mx-auto lg:mx-0"
              variants={itemVariants}
            >
              <div className="flex flex-1">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your request ID"
                  className="flex-1 p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  color="blue"
                  className="px-4 py-2 rounded-r-lg sm:rounded-l-none"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Request Lookup
                </Button>
              </div>
            </motion.form>
          </motion.div>

          <motion.div
            className="lg:w-1/2 mt-8 lg:mt-0 lg:ml-auto"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.img
              src="/cfms-customer/img/landingpagedashboard.png"
              alt="Dashboard Illustration"
              className="w-full h-auto object-contain"
              whileHover={{ scale: 1.62 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Background decorations with animation */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-[url('/img/ellipse1.png')] bg-cover bg-center opacity-50 -translate-x-1/2 -translate-y-1/2"
        animate={{
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      ></motion.div>

      <motion.div
        className="absolute bottom-0 right-0 w-72 h-72 bg-[url('/img/ellipse1.png')] bg-cover bg-center opacity-50 translate-x-1/2 translate-y-1/2"
        animate={{
          rotate: [0, -5, 0, 5, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
          delay: 1
        }}
      ></motion.div>

      {/* Search Results with animation */}
      <motion.div
        className="max-w-3xl w-full px-6 py-8 mx-auto"
        variants={fadeIn}
      >
        {searchResults.length > 0 && (
          <motion.div
            className="bg-white p-6 rounded-lg shadow border border-gray-100"
            initial="hidden"
            animate="visible"
            variants={slideUp}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Search Results</h3>
            <div className="space-y-4">
              {searchResults.map((request, index) => (
                <motion.div
                  key={request.request_id}
                  className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="font-medium text-gray-700">
                    Request ID: #{request.request_id.toString().slice(0, 8)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Status: {request.status}
                  </p>

                  {/* Case Statuses */}
                  <div className="pt-1">
                    {request.archives && request.archives.length > 0 ? (
                      request.archives.map((archive, index) => (
                        <motion.div
                          key={archive.id || index}
                          className="flex justify-between items-center text-xs mt-1"
                          whileHover={{ scale: 1.01 }}
                        >
                          <span className="text-gray-600">Case Status:</span>
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${archive.caseCustomerStatus === "Under Review"
                              ? "text-amber-600 bg-amber-100"
                              : archive.caseCustomerStatus === "Under Council Review"
                                ? "text-orange-600 bg-orange-100"
                                : archive.caseCustomerStatus === "Decision in Process"
                                  ? "text-blue-600 bg-blue-100"
                                  : "text-green-600 bg-green-100"
                              }`}
                          >
                            {archive.caseCustomerStatus || "N/A"}
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-xs">No cases available</p>
                    )}
                  </div>

                  {/* Applicants */}
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Applicants:</p>
                    {request.applicantNames ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {request.applicantNames.split(", ").map((name, index) => (
                          <motion.li
                            key={index}
                            whileHover={{ x: 5 }}
                          >
                            {name}
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No applicants listed</p>
                    )}
                  </div>

                  <span className="block mt-2 text-xs text-gray-500">
                    Requested Date: {new Date(request.request_date).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {hasSearched && searchResults.length === 0 && (
          <motion.div
            className="bg-white p-6 rounded-lg shadow border border-gray-100 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            <p className="text-gray-600">No matching results found for your query.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default HeroSection;
