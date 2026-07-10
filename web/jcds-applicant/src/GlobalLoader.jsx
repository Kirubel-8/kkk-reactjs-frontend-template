import { Spinner } from "@material-tailwind/react";
import { useLoading } from "./loading-context";

const GlobalLoader = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-50">
      <Spinner className="text-white  h-10 w-10" />{" "}
    </div>
  );
};

export default GlobalLoader;
