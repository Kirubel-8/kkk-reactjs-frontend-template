import { setOpenConfigurator, useMaterialTailwindController } from "@/context";
import NotFound from "@/NotFound";
import routes from "@/routes";
import { Configurator, DashboardNavbar, Footer } from "@/widgets/layout";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import looperBackground from "@/assets/images/Looper-3.png";
import homeLandingImage from "@/assets/images/Home_landing.png";
import { setupGlobalAuthInterceptor } from "@/utils/axiosAuthInterceptor";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const location = useLocation();
  
  // Setup global axios interceptor for 401 Unauthorized handling
  useEffect(() => {
    setupGlobalAuthInterceptor();
  }, []);
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === "/home/landing" || location.pathname === "/landing";
  
  // Check if we're on a form page (hide footer on forms)
  const isFormPage = location.pathname.includes("/new-request") ||
                     location.pathname.includes("/new-disciplinary-request") ||
                     location.pathname.includes("/new-complaint-request") ||
                     location.pathname.includes("/edit-request") ||
                     location.pathname.includes("/edit-disciplinary-request") ||
                     location.pathname.includes("/edit-complaint") ||
                     location.pathname.includes("/new-edit-disciplinary") ||
                     location.pathname.includes("/edit-complaint-v3");

  return (
    <div className="min-h-screen flex flex-col relative" style={isFormPage ? { background: '#F7F7FF' } : {}}>
      {/* Left half background image */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 hidden md:block"
        style={{
          // backgroundImage: `url(${looperBackground})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center left",
          backgroundSize: "cover",
          opacity: 0.9,
        }}
      />
      
      {/* Home Landing Background Image - Only show on landing page */}
      {isLandingPage && (
        <img
          src={homeLandingImage}
          alt="Home Landing Background"
          className="absolute pointer-events-none w-full max-w-full h-auto max-h-screen object-contain opacity-100 z-0 inset-x-0 bottom-0"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
        />
      )}
      
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-[clamp(80px,10.74vh,116px)]">
        <DashboardNavbar />
      </div>
      
      {/* Content area with padding for fixed navbar */}
      <div className="flex-grow relative z-10 pt-[clamp(80px,10.74vh,116px)]">
        <div>
          <Routes>
          <Route path="/" element={<Navigate to="requests" replace />} />
          {routes.map(
            ({ layout, pages }) =>
              layout === "home" &&
              pages.map(({ path, element }) => (
                <Route exact key={path} path={path} element={element} />
              ))
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </div>
      {/* {!isFormPage && (
        <div className="text-blue-gray-600 self-center relative z-10">
          <Footer />
        </div>
      )} */}
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;
