import React from 'react';

const LoadingPage = () => {
  return (
    <div className="flex justify-center items-center h-[40%]">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-semibold text-gray-800 mb-2">
          Loading...
        </div>
        <div className="text-sm text-gray-500">
          We are currently retrieving the latest information for you. Please wait a moment.
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;