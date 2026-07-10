import customerAuthService from "@/service/customer-auth.service";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import homeLandingImage from "../../assets/images/Home_landing.png";

import "react-toastify/dist/ReactToastify.css";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await customerAuthService.resetPasswordRequest(email);
      toast.success(
        "Password reset instructions have been sent to your email.",
        {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
          transition: Zoom,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reset instructions.",
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
      <div className="relative w-full max-w-md bg-[#f2f5f6] p-6 rounded-xl shadow-lg z-10 my-2 sm:my-4" style={{
        boxShadow: "0px 0px 16px 0px #21516729",
      }}>
        <div className="text-center mb-6">
          <h2
            className="font-bold text-[34px] leading-[130%] text-[#073954] mb-1 p-6"
            style={{
              fontFamily: "Montserrat",
              letterSpacing: "-0.68px",
            }}
          >
            Forgot Password
          </h2>
          <p
            className="font-normal text-base text-[#666666]"
            style={{
              fontFamily: "Montserrat",
            }}
          >
            Enter your email address, and we'll send you instructions to reset
            your password.
          </p>
        </div>

        <form
          onSubmit={handleForgotPassword}
          className="mt-6 mb-2 mx-auto w-full"
        >
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                className="block mb-2 text-base leading-none text-[#666666]"
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 400,
                }}
              >
                Email Address <span className="text-[#666666]" style={{ fontFamily: "Montserrat" }}>*</span>
              </label>
              <input
                type="email"
                placeholder="name@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-lg border border-[#EDF1F3] px-4 bg-white outline-none box-border text-base"
                style={{
                  boxShadow: "0px 1px 2px 0px #E4E5E73D",
                  fontFamily: "Montserrat",
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center items-center">
            <button
            type="submit"
            disabled={isLoading}
              className="w-full max-w-[304px] h-11 rounded-lg bg-[#215167] py-2.5 px-0 border-none cursor-pointer flex justify-center items-center box-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className="font-bold text-base leading-[25px] text-white"
                style={{
                  fontFamily: "Montserrat",
                  letterSpacing: "0%",
                }}
          >
            {isLoading ? "Sending..." : "Send"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-6 justify-center">
              <Link
                to="/auth/sign-in-new"
              className="text-sm leading-[140%] text-[#215167] no-underline align-middle"
              style={{
                fontFamily: "Montserrat",
                fontWeight: 600,
                letterSpacing: "-0.13px",
              }}
              >
                Back to Sign In
              </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
