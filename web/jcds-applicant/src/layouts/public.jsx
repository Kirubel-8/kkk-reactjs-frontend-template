import { PublicNavbar, Footer } from "@/widgets/layout";
import { Route, Routes } from "react-router-dom";
import homeLandingImage from "@/assets/images/Home_landing.png";

export function Public({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <img
        src={homeLandingImage}
        alt="Home Landing Background"
        className="absolute pointer-events-none w-full max-w-full h-auto max-h-screen object-contain opacity-100 z-0 inset-x-0 bottom-0"
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      />
      
      <div className="flex-grow relative z-10">
        <div className="h-[clamp(80px,10.74vh,116px)]">
          <PublicNavbar />
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
      <div className="text-blue-gray-600 self-center relative">
        <Footer />
      </div>
    </div>
  );
}

Public.displayName = "/src/layout/public.jsx";

export default Public;

