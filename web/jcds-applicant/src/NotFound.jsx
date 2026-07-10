const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8  rounded-lg shadow-sm max-w-lg w-full">
        <h1 className="text-6xl font-extrabold text-blue-600">404</h1>
        <p className="text-2xl text-gray-700 mb-4">Page Not Found</p>
        <p className="text-lg text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/home/requests"
          className="text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full text-xl transition duration-300 ease-in-out"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
