import React, { useEffect, useState } from "react";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import { Input, Button, Typography, Card } from "@material-tailwind/react";
import { FaLessThan } from "react-icons/fa";
import { useAuth } from "../../authContext";
import logo from "../../assets/images/auth/jcdms-logo.png";
import logoNewJcdms from "../../assets/images/logo_new_jcdms.png";
import homeLandingImage from "../../assets/images/Home_landing.png";
import "react-toastify/dist/ReactToastify.css";

export default function SignInNew() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const savedCredentials = JSON.parse(localStorage.getItem("rememberMe"));
    if (savedCredentials) {
      setPhoneNumber(savedCredentials.phoneNumber || "");
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const errors = {};
    const phone = phoneNumber.trim().replace(/\s+/g, '');
    
    if (!phone) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phone.startsWith('09') && !phone.startsWith('07') && !phone.startsWith('+251')) {
      errors.phoneNumber = 'Phone number must start with 09, 07, or +251';
    } else if (phone.startsWith('+251') && phone.length !== 13) {
      errors.phoneNumber = 'Phone number must have exactly 13 digits with +251';
    } else if ((phone.startsWith('09') || phone.startsWith('07')) && phone.length !== 10) {
      errors.phoneNumber = 'Phone number must have exactly 10 digits';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setTimeoutError(false);
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setTimeoutError(true);
    }, 1000);
    try {
      const response = await login(phoneNumber, password);
      clearTimeout(timeout);
      if (response.status === 200) {
        if (rememberMe) {
          localStorage.setItem("rememberMe", JSON.stringify({ phoneNumber }));
        } else {
          localStorage.removeItem("rememberMe");
        }
        toast.success("Logged in successfully", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
        navigate("/home/landing");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to login, please try again.", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        transition: Zoom,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-y-auto px-[clamp(12px,0.83vw,16px)] py-[clamp(16px,1.67vw,32px)]">
      {/* Background Image */}
      <img
        src={homeLandingImage}
        alt="Home Landing Background"
        className="absolute pointer-events-none w-full max-w-[100vw] h-auto max-h-[100vh] object-contain opacity-100 z-0 inset-x-0 bottom-0 hidden sm:block"
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Zoom}
      />

      {/* Centered Card */}
      <Card className="relative w-full max-w-[clamp(320px,32.5vw,624px)]  max-h-[652px] rounded-xl z-10 my-auto bg-[#f2f5f6] [box-shadow:0px_0px_16px_0px_#21516729] overflow-y-hidden">
        {/* Logo */}
        <div className="w-full flex justify-center pt-[clamp(24px,3.13vw,48px)] px-[clamp(16px,2.08vw,40px)]">
          <img
            src={logoNewJcdms}
            alt="JCDMS Logo"
            className="w-full max-w-[clamp(300px,27.92vw,536px)] h-[clamp(48px,7.41vh,80px)] object-contain"
          />
        </div>

        {/* LOGIN Text */}
        <div className="w-full text-center mt-[clamp(16px,1.67vw,32px)]">
          <Typography className="font-bold text-[clamp(20px,1.77vw,34px)] leading-[130%] text-[#073954] inline-block align-middle [font-family:Montserrat] [-webkit-letter-spacing:-0.68px] [letter-spacing:-0.68px]">
            Login
          </Typography>
        </div>

        {/* Form Container */}
        <form onSubmit={handleLogin} className="px-[clamp(16px,2.5vw,48px)] mt-[clamp(16px,1.67vw,32px)]">
          {/* Phone Number Field */}
          <div className="mb-[clamp(12px,0.83vw,16px)]">
            <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal">
              Phone Number <span className="text-[#666666]">*</span>
            </Typography>
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value;
                setPhoneNumber(value);
                if (formErrors.phoneNumber) {
                  setFormErrors({ ...formErrors, phoneNumber: '' });
                }
              }}
              onFocus={() => setFocusedField("phoneNumber")}
              onBlur={() => setFocusedField(null)}
              inputMode="tel"
              className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] ${
                focusedField === "phoneNumber" ? "!border-[#CFCFCF]" : formErrors.phoneNumber ? "!border-red-500" : ""
              }`}
              style={{
                height: 'clamp(44px,4.44vh,48px)',
                padding: '0 clamp(12px,0.83vw,16px)',
                fontSize: 'clamp(14px,0.83vw,16px)',
                fontFamily: 'Montserrat',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                boxShadow: '0px 1px 2px 0px #E4E5E73D',
              }}
              labelProps={{
                className: "hidden"
              }}
              containerProps={{
                className: "!min-w-0"
              }}
            />
            {formErrors.phoneNumber && (
              <div className="mt-[clamp(4px,0.42vh,6px)]">
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {formErrors.phoneNumber}
                </Typography>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="relative mb-[clamp(12px,0.83vw,16px)]">
            <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal">
              Password <span className="text-[#666666]">*</span>
            </Typography>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="*******"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  if (formErrors.password) {
                    setFormErrors({ ...formErrors, password: '' });
                  }
                }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] pr-[clamp(40px,2.08vw,40px)] ${
                  focusedField === "password" ? "!border-[#CFCFCF]" : formErrors.password ? "!border-red-500" : ""
                }`}
                style={{
                  height: 'clamp(44px,4.44vh,48px)',
                  padding: 'clamp(12px,0.625vw,12px) clamp(40px,2.08vw,40px) clamp(12px,0.625vw,12px) clamp(12px,0.625vw,12px)',
                  fontSize: 'clamp(14px,0.83vw,16px)',
                  fontFamily: 'Montserrat',
                  lineHeight: '1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  boxShadow: '0px 1px 2px 0px #E4E5E73D',
                }}
                labelProps={{
                  className: "hidden"
                }}
                containerProps={{
                  className: "!min-w-0"
                }}
                aria-label="Password input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-[clamp(12px,0.83vw,16px)] p-[clamp(6px,0.31vw,0px)] bg-transparent border-none cursor-pointer flex items-center justify-center touch-manipulation z-10"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon
                    className="text-[#ACB5BB] w-[clamp(13px,0.68vw,13px)] h-[clamp(13px,0.68vw,13px)]"
                    style={{ strokeWidth: "1.38px" }}
                  />
                ) : (
                  <EyeIcon
                    className="text-[#ACB5BB] w-[clamp(13px,0.68vw,13px)] h-[clamp(13px,0.68vw,13px)]"
                    style={{ strokeWidth: "1.38px" }}
                  />
                )}
              </button>
            </div>
            {formErrors.password && (
              <div className="mt-[clamp(4px,0.42vh,6px)]">
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {formErrors.password}
                </Typography>
              </div>
            )}
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[clamp(8px,0.42vw,0px)] mt-[clamp(12px,0.83vw,16px)]">
            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-[clamp(8px,0.42vw,8px)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[clamp(12px,0.156vw,12px)] h-[clamp(12px,0.156vw,12px)] border-2 border-[#6C7278] rounded cursor-pointer"
                style={{ accentColor: "#215167" }}
              />
              <Typography className="text-[clamp(12px,0.73vw,14px)] leading-[150%] text-[#6C7278] cursor-pointer [font-family:Montserrat] font-medium [-webkit-letter-spacing:-0.13px] [letter-spacing:-0.13px]">
                Remember me
              </Typography>
            </div>

            {/* Forgot Password */}
            <Link
              to="/auth/forget-password"
              className="text-[clamp(12px,0.73vw,14px)] leading-[140%] text-[#215167] no-underline align-middle [font-family:Montserrat] font-semibold [-webkit-letter-spacing:-0.13px] [letter-spacing:-0.13px]"
            >
              Forgot Password ?
            </Link>
          </div>

          {/* Login Button */}
          <div className="flex justify-center items-center mt-[clamp(20px,2.6vw,40px)]">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full max-w-[clamp(280px,15.83vw,304px)] h-[clamp(44px,4.44vh,48px)] py-[clamp(10px,0.65vw,10px)] px-0 rounded-lg bg-[#215167] border-none cursor-pointer flex justify-center items-center box-border disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{
                fontFamily: 'Montserrat',
                backgroundColor: '#215167',
              }}
            >
              {isLoading ? (
                <div className="flex justify-center items-center gap-[clamp(8px,0.42vw,8px)]">
                  <ArrowPathIcon className="animate-spin text-white w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)]" />
                  <span className="font-bold text-[clamp(14px,0.83vw,16px)] leading-[25px] text-white [font-family:Montserrat] [letter-spacing:0%]">
                    Signing In...
                  </span>
                </div>
              ) : (
                <span className="font-bold text-[clamp(14px,0.83vw,16px)] leading-[25px] text-white [font-family:Montserrat] [letter-spacing:0%]">
                  Login
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Sign Up Text */}
        <div className="w-full text-center pb-[clamp(16px,4.17vw,80px)] mt-[clamp(24px,2.5vw,48px)]">
          <Typography className="text-[clamp(12px,0.73vw,14px)] leading-[clamp(16px,1.67vw,32px)] text-[#3E548B80] [font-family:Montserrat] font-medium [letter-spacing:0px] inline">
            Don't have an account?{" "}
          </Typography>
          <Link
            to="/auth/sign-up-new"
            className="text-[clamp(12px,0.73vw,14px)] leading-[clamp(16px,1.67vw,32px)] text-[#215167] cursor-pointer no-underline [font-family:Montserrat] font-medium [letter-spacing:0px]"
          >
            Sign Up
          </Link>
        </div>
      </Card>
    </div>
  );
}
