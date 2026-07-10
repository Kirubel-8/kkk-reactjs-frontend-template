import requestService from "@/service/request.service";
import Header from "./Header";
import MainContent from "./MainContent";
import Footer from "./Footer";
import { useState } from "react";

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    setSearchResults([]);
    try {
      const response = await requestService.searchRequests(searchQuery);
      setSearchResults(response?.requests || []);
    } catch (error) {
      console.error("Error performing search:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('/img/background-pattern.png')] bg-repeat overflow-x-hidden">
      <Header />
      <MainContent
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchResults={searchResults}z
        hasSearched={hasSearched}
      />
      <Footer />

 
    </div>
  );
};

export default LandingPage;