import customerAuthService from "@/service/customer-auth.service";
import { Button, Input, Typography } from "@material-tailwind/react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Zoom,
      });
      setIsLoading(false);
      return;
    }

    try {
      await customerAuthService.resetPassword(
        newPassword,
        confirmPassword,
        token
      );
      toast.success(
        "Your password has been successfully reset. You can now sign in.",
        {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
          transition: Zoom,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reset password.",
        {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
          transition: Zoom,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <ToastContainer />
      <div className="w-full lg:w-3/5 mt-24">
        <div className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2 text-center">
          <Typography variant="h3" className="font-bold mb-4">
            Reset Password
          </Typography>
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="text-md font-normal"
          >
            Enter your new password below to reset it.
          </Typography>
        </div>
        <form
          onSubmit={handleResetPassword}
          className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2"
        >
          <div className="mb-1 flex flex-col gap-6">
            <div className="flex flex-col">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium text-sm sm:text-base"
              >
                New Password
              </Typography>
              <Input
                size="lg"
                placeholder="Enter new password"
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <Typography
                variant="small"
                color="blue-gray"
                className="mb-2 font-medium text-sm sm:text-base"
              >
                Confirm Password
              </Typography>
              <Input
                size="lg"
                placeholder="Confirm new password"
                className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="mt-6 w-full"
            color="indigo"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="flex items-center gap-2 mt-6 justify-end">
            <Typography variant="small" className="font-medium text-gray-900">
              <Link to="/auth/sign-in-new">Back to Sign In</Link>
            </Typography>
          </div>
        </form>
      </div>
      <div className="w-2/5 h-full hidden lg:block self-center">
        <img
          src="/jcds-applicant/img/fjacs-logo.jpg"
          className="h-full w-full object-cover rounded-3xl"
        />
      </div>
    </section>
  );
}

export default ResetPassword;
