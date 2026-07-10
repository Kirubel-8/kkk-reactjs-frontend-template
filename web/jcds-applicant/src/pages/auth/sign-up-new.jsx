import React, { useState } from "react";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import { Input, Button, Typography, Card, Option, Select } from "@material-tailwind/react";
import customerAuthService from "@/service/customer-auth.service";
import logo from "../../assets/images/auth/jcdms-logo.png";
import logoNewJcdms from "../../assets/images/logo_new_jcdms.png";
import homeLandingImage from "../../assets/images/Home_landing.png";
import "react-toastify/dist/ReactToastify.css";

export default function SignUpNew() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  // Validation function
  const validateField = (field, value) => {
    const newErrors = { ...formErrors };
    
    switch (field) {
      case 'gender':
        if (!value) {
          newErrors.gender = 'Gender is required';
        } else {
          delete newErrors.gender;
        }
        break;
        
      case 'phoneNumber':
        const phone = value.trim().replace(/\s+/g, '');
        if (!phone) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!phone.startsWith('09') && !phone.startsWith('07') && !phone.startsWith('+251')) {
          newErrors.phoneNumber = 'Phone number must start with 09, 07, or +251';
        } else if (phone.startsWith('+251') && phone.length !== 13) {
          newErrors.phoneNumber = 'Phone number must have exactly 13 digits with +251';
        } else if ((phone.startsWith('09') || phone.startsWith('07')) && phone.length !== 10) {
          newErrors.phoneNumber = 'Phone number must have exactly 10 digits';
        } else {
          delete newErrors.phoneNumber;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Password confirmation is required';
        } else if (value !== password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'email':
        // Email is optional, but if provided, must contain "@"
        if (value.trim() && !value.includes('@')) {
          newErrors.email = 'Email must contain "@"';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'firstName':
        // First name is optional, but if provided, validate format
        if (value.trim() && value.trim().length < 2) {
          newErrors.firstName = 'First name should be at least 2 characters';
        } else if (value.trim() && !/^[a-zA-Z\s\u1200-\u137F]+$/.test(value.trim())) {
          newErrors.firstName = 'First name should contain only letters and spaces';
        } else {
          delete newErrors.firstName;
        }
        break;
        
      case 'lastName':
        // Last name is optional, but if provided, validate format
        if (value.trim() && value.trim().length < 2) {
          newErrors.lastName = 'Last name should be at least 2 characters';
        } else if (value.trim() && !/^[a-zA-Z\s\u1200-\u137F]+$/.test(value.trim())) {
          newErrors.lastName = 'Last name should contain only letters and spaces';
        } else {
          delete newErrors.lastName;
        }
        break;
        
      default:
        break;
    }
    
    setFormErrors(newErrors);
  };

  const validateAllFields = () => {
    const newErrors = {};
    
    if (!gender) {
      newErrors.gender = 'Gender is required';
    }
    
    const phone = phoneNumber.trim().replace(/\s+/g, '');
    if (!phone) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phone.startsWith('09') && !phone.startsWith('07') && !phone.startsWith('+251')) {
      newErrors.phoneNumber = 'Phone number must start with 09, 07, or +251';
    } else if (phone.startsWith('+251') && phone.length !== 13) {
      newErrors.phoneNumber = 'Phone number must have exactly 13 digits with +251';
    } else if ((phone.startsWith('09') || phone.startsWith('07')) && phone.length !== 10) {
      newErrors.phoneNumber = 'Phone number must have exactly 10 digits';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Email is optional, but if provided, must contain "@"
    if (email.trim() && !email.includes('@')) {
      newErrors.email = 'Email must contain "@"';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    if (!validateAllFields()) {
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const response = await customerAuthService.createCustomerAccount(
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        confirmPassword,
        gender
      );

      setSuccessMessage(
        "Account created successfully. Please check your email for OTP."
      );

      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Zoom,
      });

      setTimeout(() => {
        navigate("/auth/verify-otp", {
          state: {
            email: email || null,
            phone_number: phoneNumber, // required
          },
        });
      }, 3000);
    } catch (error) {
      setError("Failed to create account.");
      toast.error(error.response?.data?.error || "An error occurred", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Zoom,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        input::placeholder,
        select option:first-child {
          color: #BCBCBC;
          font-family: Montserrat;
          font-weight: 400;
          font-size: 14px;
          line-height: 100%;
          letter-spacing: 0%;
        }
        input {
          color: #000;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #000 !important;
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
        }
        select {
          color: #000;
        }
        select:not([value=""]) {
          color: #000 !important;
        }
        select option:not(:first-child) {
          color: #000;
        }
      `}</style>
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
      {/* Card */}
      <Card className="rounded-[12px] w-full max-w-[clamp(320px,32.5vw,624px)] mx-auto relative z-10 my-auto bg-[#f2f5f6] [box-shadow:0px_0px_16px_0px_#21516729]">
        {/* Logo */}
        <div className="pt-[clamp(16px,2.6vw,40px)] px-[clamp(16px,2.08vw,40px)]">
          <img
            src={logoNewJcdms}
            alt="JCDMS Logo"
            className="w-full max-w-[clamp(300px,28.13vw,540px)] h-[clamp(48px,7.41vh,80px)] object-contain mx-auto"
          />
        </div>

        {/* Title */}
        <div className="mt-[clamp(8px,0.83vw,16px)] text-center">
          <Typography className="font-bold text-[clamp(20px,1.77vw,34px)] leading-[130%] text-[#073954] inline-block align-middle [font-family:Montserrat] [-webkit-letter-spacing:-0.68px] [letter-spacing:-0.68px]">
            Sign Up
          </Typography>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-[clamp(16px,1.67vw,32px)] px-[clamp(16px,2.5vw,48px)]">
          {/* First Row: First Name and Last Name */}
          <div className="flex flex-col sm:flex-row gap-[clamp(12px,0.83vw,16px)] mb-0">
            {/* First Name */}
            <div className="flex-1">
              <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
                First Name (optional)
              </Typography>
              <Input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFirstName(value);
                  validateField('firstName', value);
                }}
                onFocus={() => setFocusedField("firstName")}
                onBlur={() => setFocusedField(null)}
                className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] ${
                  focusedField === "firstName" ? "!border-[#CFCFCF]" : formErrors.firstName ? "!border-red-500" : ""
                }`}
                style={{
                  height: 'clamp(44px,4.44vh,48px)',
                  padding: 'clamp(12px,0.73vw,14px)',
                  fontSize: 'clamp(14px,0.73vw,14px)',
                  fontFamily: 'Montserrat',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                }}
                labelProps={{
                  className: "hidden"
                }}
                containerProps={{
                  className: "!min-w-0"
                }}
              />
                {formErrors.firstName && (
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formErrors.firstName}
                </Typography>
                )}
            </div>

            {/* Last Name */}
            <div className="flex-1">
              <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
                Last Name (optional)
              </Typography>
              <Input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => {
                  const value = e.target.value;
                  setLastName(value);
                  validateField('lastName', value);
                }}
                onFocus={() => setFocusedField("lastName")}
                onBlur={() => setFocusedField(null)}
                className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] ${
                  focusedField === "lastName" ? "!border-[#CFCFCF]" : formErrors.lastName ? "!border-red-500" : ""
                }`}
                style={{
                  height: 'clamp(44px,4.44vh,48px)',
                  padding: 'clamp(12px,0.73vw,14px)',
                  fontSize: 'clamp(14px,0.73vw,14px)',
                  fontFamily: 'Montserrat',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                }}
                labelProps={{
                  className: "hidden"
                }}
                containerProps={{
                  className: "!min-w-0"
                }}
              />
                {formErrors.lastName && (
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formErrors.lastName}
                </Typography>
                )}
            </div>
          </div>

          {/* Second Row: Gender and Email */}
          <div className="flex flex-col sm:flex-row gap-[clamp(12px,0.83vw,16px)] mt-[clamp(16px,1.67vw,24px)]">
            {/* Gender */}
            <div className="flex-1">
              <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
                Gender <span className="[font-family:'Montserrat',sans-serif] font-normal not-italic text-[12px] [line-height:100%] [letter-spacing:0%] text-[#FF4C4C]">*</span>
              </Typography>
              <Select
                value={gender}
                onChange={(value) => {
                  setGender(value);
                  validateField('gender', value);
                }}
                onFocus={() => setFocusedField("gender")}
                onBlur={() => setFocusedField(null)}
                className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] ${
                  focusedField === "gender" ? "!border-[#CFCFCF]" : formErrors.gender ? "!border-red-500" : ""
                }`}
                style={{
                  height: 'clamp(44px,4.44vh,48px)',
                  padding: 'clamp(12px,0.73vw,14px)',
                  fontSize: 'clamp(14px,0.73vw,14px)',
                  fontFamily: 'Montserrat',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  color: gender ? "#000" : "#BCBCBC",
                }}
                labelProps={{
                  className: "hidden"
                }}
                containerProps={{
                  className: "!min-w-0"
                }}
              >
                <Option value="">Select gender</Option>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
              </Select>
                {formErrors.gender && (
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formErrors.gender}
                </Typography>
                )}
            </div>

            {/* Email */}
            <div className="flex-1">
              <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
                Email (optional)
              </Typography>
              <Input
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  validateField('email', value);
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] ${
                  focusedField === "email" ? "!border-[#CFCFCF]" : formErrors.email ? "!border-red-500" : ""
                }`}
                style={{
                  height: 'clamp(44px,4.44vh,48px)',
                  padding: 'clamp(12px,0.73vw,14px)',
                  fontSize: 'clamp(14px,0.73vw,14px)',
                  fontFamily: 'Montserrat',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                }}
                labelProps={{
                  className: "hidden"
                }}
                containerProps={{
                  className: "!min-w-0"
                }}
              />
                {formErrors.email && (
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formErrors.email}
                </Typography>
                )}
            </div>
          </div>

          {/* Phone Number - Full Width */}
          <div className="mt-[clamp(16px,1.67vw,24px)]">
            <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
              Phone Number <span className="[font-family:'Montserrat',sans-serif] font-normal not-italic text-[12px] [line-height:100%] [letter-spacing:0%] text-[#FF4C4C]">*</span>
            </Typography>
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value;
                setPhoneNumber(value);
                validateField('phoneNumber', value);
              }}
              onFocus={() => setFocusedField("phoneNumber")}
              onBlur={() => setFocusedField(null)}
              inputMode="tel"
              className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] ${
                focusedField === "phoneNumber" ? "!border-[#CFCFCF]" : formErrors.phoneNumber ? "!border-red-500" : ""
              }`}
              style={{
                height: 'clamp(44px,4.44vh,48px)',
                padding: 'clamp(12px,0.73vw,14px)',
                fontSize: 'clamp(14px,0.73vw,14px)',
                fontFamily: 'Montserrat',
                lineHeight: '100%',
                letterSpacing: '0%',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
              }}
              labelProps={{
                className: "hidden"
              }}
              containerProps={{
                className: "!min-w-0"
              }}
            />
              {formErrors.phoneNumber && (
              <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {formErrors.phoneNumber}
              </Typography>
              )}
          </div>

          {/* Third Row: Password and Confirmation Password */}
          <div className="flex flex-col sm:flex-row gap-[clamp(12px,0.83vw,16px)] mt-[clamp(16px,1.67vw,24px)]">
            {/* Password */}
            <div className="flex-1">
              <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
                Password <span className="[font-family:'Montserrat',sans-serif] font-normal not-italic text-[12px] [line-height:100%] [letter-spacing:0%] text-[#FF4C4C]">*</span>
              </Typography>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    validateField('password', value);
                    // Re-validate confirm password if it exists
                    if (confirmPassword) {
                      validateField('confirmPassword', confirmPassword);
                    }
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] pr-[clamp(40px,2.08vw,48px)] ${
                    focusedField === "password" ? "!border-[#CFCFCF]" : formErrors.password ? "!border-red-500" : ""
                  }`}
                  style={{
                    height: 'clamp(44px,4.44vh,48px)',
                    padding: 'clamp(12px,0.625vw,12px) clamp(40px,2.08vw,40px) clamp(12px,0.625vw,12px) clamp(12px,0.625vw,12px)',
                    fontSize: 'clamp(14px,0.73vw,14px)',
                    fontFamily: 'Montserrat',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#000',
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[clamp(12px,0.83vw,16px)] top-1/2 -translate-y-1/2 p-[clamp(6px,0.31vw,0px)] bg-transparent border-none cursor-pointer flex items-center justify-center touch-manipulation z-10"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon
                      className="text-[#ACB5BB] w-[clamp(14px,0.73vw,14px)] h-[clamp(14px,0.73vw,14px)]"
                      style={{ strokeWidth: "1.38px" }}
                    />
                  ) : (
                    <EyeIcon
                      className="text-[#ACB5BB] w-[clamp(14px,0.73vw,14px)] h-[clamp(14px,0.73vw,14px)]"
                      style={{ strokeWidth: "1.38px" }}
                    />
                  )}
                </button>
              </div>
                {formErrors.password && (
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formErrors.password}
                </Typography>
                )}
            </div>

            {/* Confirmation Password */}
            <div className="flex-1">
              <Typography className="block mb-[clamp(6px,0.52vw,8px)] text-[clamp(12px,0.83vw,16px)] leading-none text-[#666666] [font-family:Montserrat] font-normal [letter-spacing:0%]">
                Confirmation <span className="[font-family:'Montserrat',sans-serif] font-normal not-italic text-[12px] [line-height:100%] [letter-spacing:0%] text-[#FF4C4C]">*</span>
              </Typography>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPassword(value);
                    validateField('confirmPassword', value);
                  }}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  className={`h-[clamp(44px,4.44vh,48px)] !border-t-[#EDF1F3] !border-r-[#EDF1F3] !border-b-[#EDF1F3] !border-l-[#EDF1F3] focus:!border-[#CFCFCF] pr-[clamp(40px,2.08vw,48px)] ${
                    focusedField === "confirmPassword" ? "!border-[#CFCFCF]" : formErrors.confirmPassword ? "!border-red-500" : ""
                  }`}
                  style={{
                    height: 'clamp(44px,4.44vh,48px)',
                    padding: 'clamp(12px,0.625vw,12px) clamp(40px,2.08vw,40px) clamp(12px,0.625vw,12px) clamp(12px,0.625vw,12px)',
                    fontSize: 'clamp(14px,0.73vw,14px)',
                    fontFamily: 'Montserrat',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    borderRadius: '0.5rem',
                    backgroundColor: 'white',
                    color: '#000',
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-[clamp(12px,0.83vw,16px)] top-1/2 -translate-y-1/2 p-[clamp(6px,0.31vw,0px)] bg-transparent border-none cursor-pointer flex items-center justify-center touch-manipulation z-10"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon
                      className="text-[#ACB5BB] w-[clamp(14px,0.73vw,14px)] h-[clamp(14px,0.73vw,14px)]"
                      style={{ strokeWidth: "1.38px" }}
                    />
                  ) : (
                    <EyeIcon
                      className="text-[#ACB5BB] w-[clamp(14px,0.73vw,14px)] h-[clamp(14px,0.73vw,14px)]"
                      style={{ strokeWidth: "1.38px" }}
                    />
                  )}
                </button>
              </div>
                {formErrors.confirmPassword && (
                <Typography className="font-['Montserrat'] font-normal text-xs leading-none tracking-normal text-red-500 mt-[clamp(4px,0.42vh,6px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formErrors.confirmPassword}
                </Typography>
                )}
            </div>
          </div>

          {/* SignUp Button */}
          <div className="mt-[clamp(16px,1.56vw,24px)] flex justify-center items-center mb-[clamp(10px,0.52vw,10px)]">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full max-w-[clamp(280px,15.83vw,304px)] h-[clamp(44px,4.44vh,48px)] py-[clamp(10px,0.65vw,10px)] px-0 rounded-lg border-none cursor-pointer flex justify-center items-center box-border bg-[#215167] font-bold text-[clamp(14px,0.83vw,16px)] text-white disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation [font-family:Montserrat] leading-[25px] [letter-spacing:0%]"
              style={{
                fontFamily: 'Montserrat',
                backgroundColor: '#215167',
              }}
            >
              {isLoading ? (
                <div className="flex justify-center items-center gap-[clamp(8px,0.42vw,8px)]">
                  <ArrowPathIcon className="animate-spin text-white w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)]" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Sign Up"
              )}
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-[clamp(8px,0.62vw,12px)] pb-[clamp(16px,2.08vw,32px)]">
            <Typography className="text-[clamp(12px,0.73vw,14px)] leading-[clamp(16px,2.22vh,32px)] text-[#3E548B80] [font-family:Montserrat] font-medium [letter-spacing:0px] inline">
              Do you have an account?{" "}
            </Typography>
            <Link
              to="/auth/sign-in-new"
              className="text-[clamp(12px,0.73vw,14px)] leading-[clamp(16px,2.22vh,32px)] text-[#215167] cursor-pointer no-underline [font-family:Montserrat] font-medium [letter-spacing:0px]"
            >
              Sign In
            </Link>
          </div>
        </form>
      </Card>
    </div>
    </>
  );
}
