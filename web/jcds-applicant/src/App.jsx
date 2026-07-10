import { Auth, Dashboard } from "@/layouts";
import { RouterProvider } from "react-router-dom";
import GlobalLoader from "./GlobalLoader";
import { LoadingProvider } from "./loading-context";
import ProtectedRoute from "./ProtectedRoute";
import router from "./routes/index";

function App() {
  return (
    <LoadingProvider>
      <GlobalLoader />
      <RouterProvider router={router} />
    </LoadingProvider>
  );
}

export default App;
