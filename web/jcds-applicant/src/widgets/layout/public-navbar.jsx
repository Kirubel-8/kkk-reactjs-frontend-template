import { useMaterialTailwindController } from "@/context";
import {
  Button,
  Navbar,
  Typography,
  Drawer,
  IconButton,
} from "@material-tailwind/react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import logoNewJcdms from "../../assets/images/logo_new_jcdms.png";

export function PublicNavbar() {
  const [controller] = useMaterialTailwindController();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  const handleLogoClick = () => {
    navigate("/main-landing");
  };

  const handleLoginClick = () => {
    navigate("/auth/sign-in-new");
  };

  const handleRegisterClick = () => {
    navigate("/auth/sign-up-new");
  };

  return (
    <>
    <Navbar
      color="white"
      className="transition-all h-full min-h-[clamp(80px,10.74vh,116px)] w-full bg-white sticky z-40 py-[clamp(8px,0.74vh,12px)] shadow-[0_0_12px_0_#0000001F] ml-0 pl-[clamp(8px,2.5vw,96px)] pr-[clamp(8px,2.5vw,96px)]"
      fullWidth
      blurred={false}
    >
        <div className="flex justify-between items-center gap-[clamp(8px,0.83vw,24px)] h-full relative">
          {/* Left side - Drawer button (mobile only) */}
          <div className="lg:hidden flex items-center">
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={handleDrawerToggle}
            >
              <Bars3Icon className="h-[clamp(20px,1.25vw,24px)] w-[clamp(20px,1.25vw,24px)] text-blue-gray-500" />
            </IconButton>
          </div>

          {/* Logo - centered on mobile, left-aligned on desktop */}
          <div
            className="flex items-center cursor-pointer absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-0 lg:transform-none"
          onClick={handleLogoClick}
        >
          <img
            src={logoNewJcdms}
            alt="FJACS Logo"
            style={{ opacity: 1 }}
            className="transition-all object-contain w-full max-w-[clamp(200px,22.5vw,432px)] h-auto max-h-[clamp(40px,5.83vh,63px)]"
          />
        </div>

          {/* Desktop menu items - shown only at lg and above */}
          <div className="hidden lg:flex items-center gap-[clamp(16px,1.67vw,32px)] flex-1 justify-center">
            <Button
              variant="text"
              className={`normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/main-landing"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                navigate("/main-landing");
              }}
            >
              Home
            </Button>
            <Button
              variant="text"
              className={`normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/announcement"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                navigate("/announcement");
              }}
            >
              Announcement
            </Button>
            <Button
              variant="text"
              className={`normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/faq"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                navigate("/faq");
              }}
            >
              FAQ
            </Button>
          </div>

          {/* Right side - Desktop buttons (lg and above) */}
          <div className="hidden lg:flex items-center justify-center gap-[clamp(16px,0.83vw,16px)]">
            {/* Register Button */}
            <Button
              variant="outlined"
              onClick={handleRegisterClick}
              className="normal-case hover:shadow-md transition-all hover:bg-transparent flex items-center justify-center w-full max-w-[clamp(100px,6.35vw,122px)] h-auto max-h-[clamp(40px,4.44vh,48px)] rounded-lg px-[clamp(16px,1.25vw,24px)] gap-[clamp(6px,0.42vw,8px)] opacity-100 border border-[#073954] bg-transparent"
            >
              <Typography className="[font-family:Montserrat] font-bold not-italic text-[clamp(12px,0.73vw,14px)] leading-[clamp(40px,4.44vh,48px)] [letter-spacing:1.2%] uppercase text-[#073954] flex items-center justify-center">
                REGISTER
              </Typography>
            </Button>

            {/* Login Button */}
            <Button
              onClick={handleLoginClick}
              className="normal-case hover:shadow-md transition-all flex items-center justify-center w-full max-w-[clamp(80px,5vw,96px)] h-auto max-h-[clamp(40px,4.44vh,48px)] rounded-lg px-[clamp(16px,1.25vw,24px)] gap-[clamp(6px,0.42vw,8px)] opacity-100 bg-[#215167] border-none"
            >
              <Typography className="[font-family:Montserrat] font-bold not-italic text-[clamp(12px,0.73vw,14px)] leading-[clamp(40px,4.44vh,48px)] [letter-spacing:1.2%] uppercase text-white flex items-center justify-center">
                LOGIN
              </Typography>
            </Button>
          </div>

          {/* Spacer for mobile to balance the drawer button */}
          <div className="lg:hidden w-[clamp(32px,2.08vw,40px)]" />
        </div>
      </Navbar>

      {/* Drawer - shown only from sm to md */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        className="lg:hidden"
      >
        <div className="flex flex-col h-full p-[clamp(12px,0.83vw,16px)] w-full max-w-[clamp(200px,13.33vw,256px)]">
          {/* Logo at the top */}
          <div
            className="flex items-center justify-center cursor-pointer mb-[clamp(20px,1.56vw,24px)] pb-[clamp(12px,0.83vw,16px)] border-b border-[#C2C2C2] border-opacity-50"
            onClick={() => {
              handleDrawerToggle();
              handleLogoClick();
            }}
          >
            <img
              src={logoNewJcdms}
              alt="FJACS Logo"
              style={{ opacity: 1 }}
              className="transition-all object-contain w-full max-w-[clamp(150px,10.42vw,200px)] h-auto max-h-[clamp(35px,4.63vh,50px)]"
            />
          </div>

          {/* Menu items section */}
          <div className="flex flex-col space-y-[clamp(6px,0.42vw,8px)]">
            <Button
              variant="text"
              className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/main-landing"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                handleDrawerToggle();
                navigate("/main-landing");
              }}
            >
              <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Home
              </Typography>
            </Button>

            <Button
              variant="text"
              className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/announcement"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                handleDrawerToggle();
                navigate("/announcement");
              }}
            >
              <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Announcement
              </Typography>
            </Button>

            <Button
              variant="text"
              className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/faq"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                handleDrawerToggle();
                navigate("/faq");
              }}
            >
              <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                FAQ
              </Typography>
            </Button>
          </div>

          {/* Bottom section with Register and Login buttons */}
          <div className="mt-auto pt-[clamp(12px,0.83vw,16px)] space-y-[clamp(6px,0.42vw,8px)]">
            <div className="w-full h-[clamp(0.5px,0.05vh,1px)] bg-[#C2C2C2] bg-opacity-50 rounded-lg mb-[clamp(6px,0.42vw,8px)]" />
            
            <Button
              variant="text"
              className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/auth/sign-up-new"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                handleDrawerToggle();
                handleRegisterClick();
              }}
            >
              <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Register
              </Typography>
            </Button>

            <Button
              variant="text"
              className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                pathname === "/auth/sign-in-new"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                handleDrawerToggle();
                handleLoginClick();
              }}
            >
              <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Login
              </Typography>
            </Button>
        </div>
      </div>
      </Drawer>
    </>
  );
}

PublicNavbar.displayName = "/src/widgets/layout/public-navbar.jsx";

export default PublicNavbar;

