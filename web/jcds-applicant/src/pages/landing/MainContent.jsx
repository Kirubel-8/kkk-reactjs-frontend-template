import HeroSection from "./HeroSection";
import BodyContent from "./BodyContent";

const MainContent = ({ searchQuery, setSearchQuery, handleSearch, searchResults, hasSearched }) => {
  return (
    <>
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} searchResults={searchResults} hasSearched={hasSearched} />
      <BodyContent />
    </>
  );
};

export default MainContent;