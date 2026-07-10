import customerAuthService from "@/service/customer-auth.service";
import {
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { Button, Input, Typography } from "@material-tailwind/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/images/auth/jcdms-logo.png";
import backgroundImage from "../../assets/images/auth/Login_background.png"; 
export function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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
        navigate("/auth/verify-otp",{
          state: {
            email: email || null,
            phone_number: phoneNumber, // required
          }
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
   <section
      className="flex flex-col items-center justify-center min-h-screen px-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
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

      <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-lg">
        <div className="w-full flex justify-center mb-4">
          <img
            src={logo}
            alt="FJACS Logo"
          />
        </div>

        <div className="text-center mb-2">
          <Typography
            variant="h5"
            className=" text-[#153B4D] mb-1"
          >
            Create Your Account
          </Typography>
        </div>
        <div className="text-center mb-4">
          <p className="text-gray-600 text-sm">
            Required fields: <span className="font-small text-[#153B4D]">Phone Number and Gender</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 mb-2 mx-auto w-full">
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex flex-col w-1/2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-1 text-sm sm:text-base"
                >
                  First Name <span className="text-gray-500 text-xs">(Optional)</span>
                </Typography>
                <Input
                  size="md"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                  aria-label="First name input"
                />
              </div>

              <div className="flex flex-col w-1/2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-1 text-sm sm:text-base"
                >
                  Last Name <span className="text-gray-500 text-xs">(Optional)</span>
                </Typography>
                <Input
                  size="md"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                  aria-label="Last name input"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col w-1/2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-1 text-sm sm:text-base"
                >
                  Gender <span className="text-red-500">*</span>
                </Typography>

                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="bg-white border border-blue-gray-200 focus:border-gray-900 rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="flex flex-col w-1/2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-1 text-sm sm:text-base"
                >
                  Phone Number <span className="text-red-500">*</span>
                </Typography>
                <Input
                  size="md"
                  placeholder="+251(0) -- --- ---"
                  className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  pattern="(\+251\d{8}|09\d{8}|0[1-8]\d{8})"
                />
              </div>
            </div>

            <div className="flex flex-col w-2/3">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-1 text-sm sm:text-base"
              >
                Email <span className="text-gray-500 text-xs">(Optional)</span>
              </Typography>
              <Input
                type="email"
                size="md"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                aria-label="Email input"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col w-1/2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-1 text-sm sm:text-base"
                >
                  Password <span className="text-red-500">*</span>
                </Typography>
                <div className="relative">
                  <Input
                    size="md"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                    aria-label="Password input"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col w-1/2">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mb-1 text-sm sm:text-base"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </Typography>
                <div className="relative">
                  <Input
                    size="md"
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white !border-t-blue-gray-200 focus:!border-t-gray-900"
                    aria-label="Confirm password input"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 transform -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="mt-6 w-full bg-[#1E516A] text-white hover:bg-[#153B4D]"
            color="indigo"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex justify-center items-center space-x-2">
                <ArrowPathIcon className="animate-spin h-5 w-5 text-white" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Register Now"
            )}
          </Button>

          <hr className="my-8 border-t-2 border-gray-300" />

          <Typography
            variant="small"
            className="text-center text-gray-700 font-medium mt-4"
          >
            Already have an account?
            <Link
              to="/auth/sign-in-new"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 ml-1"
            >
              Sign in
            </Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;