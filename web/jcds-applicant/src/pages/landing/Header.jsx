import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "@material-tailwind/react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkStyles = ({ isActive }) =>
    `text-lg font-medium transition-all duration-300 ease-in-out ${
      isActive
        ? "text-blue-700 border-b-2 border-blue-700"
        : "text-gray-800 hover:text-blue-700 hover:border-b-2 hover:border-blue-200"
    }`;

  return (
    <nav className="bg-[url('/img/background1.png')] bg-cover bg-center bg-opacity-50  sticky top-0 z-50" style={{ backgroundColor: '#F2FBFA' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" aria-label="Home">
              <img
                src="/cfms-customer/img/cci_logo.png"
                className="h-14 w-auto object-contain transition-transform duration-300 hover:scale-110"
                alt="CCI Logo"
              />
            </NavLink>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/" className={navLinkStyles}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkStyles}>
              About
            </NavLink>
             <NavLink to="/faq" className={navLinkStyles}>
              Requirement
            </NavLink>

            <NavLink to="/faq" className={navLinkStyles}>
              FAQ
            </NavLink>
            <NavLink to="/contact" className={navLinkStyles}>
              Contact Us
            </NavLink>
            <NavLink to="/auth/sign-in-new">
              {({ isActive }) => (
                <Button
                  variant={isActive ? "filled" : "outlined"}
                  color="blue"
                  size="sm"
                  className="px-5 py-2.5 rounded-lg font-medium tracking-wide transition-all duration-300"
                  aria-label="Login"
                >
                  Login
                </Button>
              )}
            </NavLink>
            <NavLink to="/auth/sign-up">
              {({ isActive }) => (
                <Button
                  variant="filled"
                  color={isActive ? "blue-gray" : "blue"}
                  size="sm"
                  className="px-5 py-2.5 rounded-lg font-medium tracking-wide shadow-md hover:shadow-lg transition-all duration-300"
                  aria-label="Sign Up"
                >
                  Sign Up
                </Button>
              )}
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-6 px-4 bg-white shadow-lg animate-slide-in">
            <div className="space-y-3">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-md text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-800 hover:text-blue-700 hover:bg-blue-50"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-md text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-800 hover:text-blue-700 hover:bg-blue-50"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </NavLink>
              <NavLink
                to="/faq"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-md text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-800 hover:text-blue-700 hover:bg-blue-50"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-md text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-blue-700 bg-blue-50"
                      : "text-gray-800 hover:text-blue-700 hover:bg-blue-50"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </NavLink>
              <NavLink
                to="/auth/sign-in-new"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-md text-lg font-medium border border-blue-600 transition-all duration-300 ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-blue-600 hover:bg-blue-50"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </NavLink>
              <NavLink
                to="/auth/sign-up"
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-md text-lg font-medium text-white transition-all duration-300 ${
                    isActive ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;