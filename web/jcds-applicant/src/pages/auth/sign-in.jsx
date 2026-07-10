import {
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { Button, Checkbox, Input, Typography } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import { useAuth } from "../../authContext";
import logo from "../../assets/images/auth/jcdms-logo.png";
import backgroundImage from "../../assets/images/auth/Login_background.png"; 
import "react-toastify/dist/ReactToastify.css";

export function SignIn() {
  const { login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCredentials = JSON.parse(localStorage.getItem("rememberMe"));
    if (savedCredentials) {
      setPhoneNumber(savedCredentials.phoneNumber || "");
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
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

      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
        <div className="w-full flex justify-center mb-4">
          <img
            src={logo}
            alt="FJACS Logo"
          />
        </div>

        <div className="text-center mb-6">
          <Typography
            variant="h5"
            className="font-semibold text-[#1E516A] mb-1"
          >
            Welcome Back!
          </Typography>
        
        </div>

        <form onSubmit={handleLogin} className="mt-6 mb-2 mx-auto w-full">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-1 text-sm"
              >
                Phone Number
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

            <div className="flex flex-col">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-1 text-sm"
              >
                Password
              </Typography>
              <div className="relative">
                <Input
                  id="password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

       <div className="flex items-center justify-between mt-4">
  {/* Left: Remember Me */}
  <div className="flex items-center gap-2">
    <Checkbox
      color="indigo"
      checked={rememberMe}
      onChange={() => setRememberMe(!rememberMe)}
      label={
        <Typography variant="small" className="font-medium text-[#1E516A] text-sm">
          Remember Me
        </Typography>
      }
      containerProps={{ className: "-ml-2.5" }}
    />
  </div>

  {/* Right: Forgot Password */}
  <Typography variant="small" className="font-medium text-[#1E516A]">
    <Link
      to="/auth/forget-password"
      className="text-[#1E516A]hover:text-blue-800 transition-colors duration-200"
    >
      Forgot your password?
    </Link>
  </Typography>
</div>


    <Button
  type="submit"
  className="mt-6 w-full bg-[#1E516A] text-white hover:bg-[#153B4D]"
  disabled={isLoading}
>
  {isLoading ? (
    <div className="flex justify-center items-center space-x-2">
      <ArrowPathIcon className="animate-spin h-5 w-5 text-white" />
      <span>Signing In...</span>
    </div>
  ) : (
    "Sign In"
  )}
</Button>



          

          <Typography
            variant="small"
            className="text-center text-gray-700 font-medium mt-4"
          >
            Not registered?
            <Link
              to="/auth/sign-up"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 ml-1"
            >
              Create an account
            </Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignIn;