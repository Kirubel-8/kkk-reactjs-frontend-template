import customerAuthService from "@/service/customer-auth.service";
import {
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { Button, Input, Typography } from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import homeLandingImage from "../../assets/images/Home_landing.png";
import "react-toastify/dist/ReactToastify.css";

export function FirstTimeLogin() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customerId = localStorage.getItem("customerId");
        if (!customerId) return;

        const response = await customerAuthService.getCustomerById(customerId);
        const customer = response.data;

        setFullName(customer.full_name || "");
        setEmail(customer.email || "");
        setPhoneNumber(customer.phone_number || "");
      } catch (error) {
        console.error("Failed to fetch customer details:", error);
        toast.error("Failed to load customer data", {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
          transition: Zoom,
        });
      }
    };

    fetchCustomer();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const customerId = localStorage.getItem("customerId");

      if (newPassword && newPassword !== confirmPassword) {
        toast.error("New password and confirm password do not match!", {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
          transition: Zoom,
        });
        setIsLoading(false);
        return;
      }

      const payload = {};
      if (fullName) payload.full_name = fullName;
      if (phoneNumber) payload.phone_number = phoneNumber;
      if (email && email.trim() !== "") payload.email = email.trim();
      if (oldPassword) payload.current_password = oldPassword;
      if (newPassword) payload.new_password = newPassword;
      if (confirmPassword) payload.confirm_password = confirmPassword;


      const response = await customerAuthService.updateRespondentAccount(
        customerId,
        payload
      );

      toast.success("Account updated successfully!", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });

      const updatedCustomer = response.data.customer;
      setFullName(updatedCustomer.full_name || "");
      setPhoneNumber(updatedCustomer.phone_number || "");
      setEmail(updatedCustomer.email || "");

      setTimeout(() => {
        navigate("/auth/sign-in-new");
      }, 2000);
    } catch (error) {
      console.error("Update failed:", error.response || error);

      const err = error.response?.data;
      const message =
        err?.message || err?.error || "An error occurred while updating account";

      toast.error(message, {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
    } finally {
      setIsLoading(false);
    }
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
      <div className="relative w-full sm:mx-auto sm:max-w-md bg-[#f2f5f6] p-6 rounded-xl shadow-lg z-10 my-2 sm:my-4" style={{
        boxShadow: "0px 0px 16px 0px #21516729",
      }}>
        <div className="text-center mb-6">
          <Typography 
            variant="h4" 
            className="font-semibold text-[#DBC718] mb-1"
            style={{ fontFamily: "Montserrat" }}
          >
            First-Time Login
          </Typography>
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="text-base font-normal opacity-50"
            style={{ fontFamily: "Montserrat" }}
          >
            Please complete your profile and update your password
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 mb-2 mx-auto w-full">
          <div className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ fontFamily: "Montserrat" }}
              labelProps={{ style: { fontFamily: "Montserrat" } }}
            />

            <Input
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontFamily: "Montserrat" }}
              labelProps={{ style: { fontFamily: "Montserrat" } }}
            />

            <Input
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              style={{ fontFamily: "Montserrat" }}
              labelProps={{ style: { fontFamily: "Montserrat" } }}
            />

            <Input
              label="Current Password"
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              style={{ fontFamily: "Montserrat" }}
              labelProps={{ style: { fontFamily: "Montserrat" } }}
              icon={
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              }
            />

            <Input
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ fontFamily: "Montserrat" }}
              labelProps={{ style: { fontFamily: "Montserrat" } }}
              icon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ fontFamily: "Montserrat" }}
              labelProps={{ style: { fontFamily: "Montserrat" } }}
              icon={
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            className="mt-6 w-full bg-[#215167] text-white font-semibold rounded-lg transition duration-300"
            disabled={isLoading}
            style={{ fontFamily: "Montserrat" }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center space-x-2">
                <ArrowPathIcon className="animate-spin h-5 w-5 text-white" />
                <span style={{ fontFamily: "Montserrat" }}>Updating...</span>
              </div>
            ) : (
              <span style={{ fontFamily: "Montserrat" }}>Update Account</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default FirstTimeLogin;
