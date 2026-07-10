import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, Typography } from "@material-tailwind/react";
import { toast, ToastContainer, Zoom } from "react-toastify";
import customerAuthService from "@/service/customer-auth.service";
import homeLandingImage from "../../assets/images/Home_landing.png";

import "react-toastify/dist/ReactToastify.css";
import logo from "@/assets/images/auth/jcdms-logo.png";

export function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  // const email = location.state?.email || "example@mail.com"; 
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [resendDisabled, setResendDisabled] = useState(true); 
  const [resendTime, setResendTime] = useState(10 * 60);
  const email = location.state?.email || null;
  const phone_number = location.state?.phone_number || null; 
  
  const contactInfo = email ? email : phone_number;

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
  
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
  
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };
  
  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      handleSubmit();
    }
  }, [otp]);
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
  
    const enteredOtp = otp.join("");
  
    if (enteredOtp.length < 6) {
      setError("Please enter a 6-digit OTP.");
      toast.error("Please enter a 6-digit OTP.", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
      return;
    }
  
    try {
      await customerAuthService.verifyOTP(email, phone_number, enteredOtp,);
      toast.success("OTP Verified Successfully!", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
      setTimeout(() => {
        navigate("/home/landing");
      }, 3000);
    } catch (error) {
      setError("Invalid OTP. Please try again.");
      toast.error(error.response?.data?.error || "Invalid OTP. Please try again.", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
    }
  };
  

  const handleResend = async () => {
    try {
      setResendDisabled(true);
      await customerAuthService.resendOTP(email, phone_number);
      toast.success("OTP has been resent to your email.", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
      setResendTime(10 * 60);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error resending OTP.", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden px-3 sm:px-4 py-4 sm:py-8">
      {/* Background Image */}
      <img
        src={homeLandingImage}
        alt="Home Landing Background"
        className="absolute pointer-events-none w-full max-w-full h-auto max-h-screen object-contain opacity-100 z-0 inset-x-0 bottom-0 hidden sm:block"
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
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
      <div className="relative bg-[#f2f5f6] rounded-lg shadow-lg p-6 w-full max-w-md z-10 my-2 sm:my-4" style={{
        boxShadow: "0px 0px 16px 0px #21516729",
      }}>
          <div className="w-full flex justify-center mb-4">
                  <img
                    src={logo}
                    alt="FJACS Logo"
                  />
                </div>
        <Typography 
          variant="h3" 
          className="text-center font-bold mb-4"
          style={{ fontFamily: "Montserrat" }}
        >
          OTP Verification
        </Typography>
        <Typography 
          className="text-center text-gray-500 mb-8"
          style={{ fontFamily: "Montserrat" }}
        >
          We have sent a code to <span className="font-bold" style={{ fontFamily: "Montserrat" }}>{contactInfo}</span>
        </Typography>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => {
                  e.target.select();
                  e.target.style.boxShadow = "0 0 0 2px #073954";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "";
                }}
                className="w-12 h-12 text-center text-lg font-medium border border-gray-300 rounded focus:outline-none"
                style={{ fontFamily: "Montserrat" }}
              />
            ))}
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            style={{ fontFamily: "Montserrat", backgroundColor: "#073954" }}
          >
            Verify Account
          </Button>
        </form>
        <div className="text-center mt-4">
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="text-sm"
            style={{ fontFamily: "Montserrat" }}
          >
            Didn't receive code?{" "}
            <button
              type="button"
              disabled={resendDisabled}
              onClick={handleResend}
              className={`font-semibold ${
                resendDisabled ? "text-gray-400" : "hover:underline"
              }`}
              style={{ 
                fontFamily: "Montserrat",
                color: resendDisabled ? "#9CA3AF" : "#073954"
              }}
            >
              {resendDisabled ? `Resend in ${formatTime(resendTime)}` : "Resend"}
            </button>
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;