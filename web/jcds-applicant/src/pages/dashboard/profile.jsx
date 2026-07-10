import { useLoading } from "@/LoadingContext";
import customerAuthService from "@/service/customer-auth.service";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  PhoneIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Card,
  Input,
  Tab,
  Tabs,
  TabsHeader,
  Typography,
} from "@material-tailwind/react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Profile() {
  const [showChangePassword, setShowChangePassword] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const customerAccountToken = localStorage.getItem("customerAccountToken");
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();

  useEffect(() => {
    if (customerAccountToken) {
      const decodedToken = jwtDecode(customerAccountToken);
      const userId = decodedToken.id;
      const fetchUserProfile = async () => {
        try {
          const response = await customerAuthService.getCustomerById(userId);
          if (response.data) {
            const fullName = response.data.full_name || "";
            const nameParts = fullName.split(" ");
            setUser({
              id: userId,
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              phone: response.data.phone_number || "",
              email: response.data.email || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    } else {
      console.log("No token found");
    }
  }, [customerAccountToken]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from the current password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await customerAuthService.updateCustomerAccount(
        user.id,
        currentPassword,
        newPassword,
        confirmPassword,
        null
      );

      toast.success("Password changed successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating password.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      console.log(path);
      stopLoading();
    }, 500);
  };

  return (
    <div className="p-6 container mx-auto">
      <ToastContainer />
      <div className="flex items-center gap-8 mb-4">
        <Button
          variant="outlined"
          className="flex items-center gap-2"
          onClick={() => handleNavigation("/home/requests")}
          style={{ fontFamily: "Montserrat" }}
        >
          <ArrowLeftIcon className="h-3 w-3 text-gray-600" />
        </Button>
        <Typography variant="h4" className="font-bold" style={{ fontFamily: "Montserrat" }}>
          User Profile
        </Typography>
        <Typography variant="paragraph" className="text-gray-600" style={{ fontFamily: "Montserrat" }}>
          All the information for the User
        </Typography>
      </div>

      <Card className="mt-6 shadow-none rounded-lg p-6 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center h-14 w-14 bg-blue-50 rounded-full shadow-sm">
            <UserIcon className="h-8 w-8 text-blue-700" />
          </div>
          <div>
            <Typography variant="h6" className="text-blue-700 font-semibold" style={{ fontFamily: "Montserrat" }}>
              User Profile Overview
            </Typography>
            <Typography variant="h7" className="text-gray-600 text-sm" style={{ fontFamily: "Montserrat" }}>
              This section provides the user's personal information, including
              first name, last name, contact details, and the option to update
              the password.
            </Typography>
          </div>
        </div>

        <div className="w-fit">
          <Tabs value="personal-info" className="mt-4">
            <TabsHeader className="flex space-x-2">
              <Tab value="personal-info" className="w-52 min-w-20 text-center">
                <div className="flex items-center justify-center gap-2">
                  <UserCircleIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm" style={{ fontFamily: "Montserrat" }}>Personal Info</span>
                </div>
              </Tab>
            </TabsHeader>
          </Tabs>
        </div>

        <div className="flex flex-wrap  mt-6">
          <Card className="shadow-sm rounded-lg p-4 bg-white w-1/2">
            <Typography variant="h6" className="font-bold" style={{ fontFamily: "Montserrat" }}>
              Applicant Detail
            </Typography>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <Typography variant="small" className="text-gray-500" style={{ fontFamily: "Montserrat" }}>
                  First name
                </Typography>
                <Typography className="font-semibold" style={{ fontFamily: "Montserrat" }}>
                  {user?.firstName || "N/A"}
                </Typography>
              </div>
              <div>
                <Typography variant="small" className="text-gray-500" style={{ fontFamily: "Montserrat" }}>
                  Last name
                </Typography>
                <Typography className="font-semibold" style={{ fontFamily: "Montserrat" }}>
                  {user?.lastName || "N/A"}
                </Typography>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-14">
              <Card className="p-4 bg-gray-100 rounded-md w-80 shadow-none">
                <Typography variant="h6" className="font-bold" style={{ fontFamily: "Montserrat" }}>
                  Contact Information
                </Typography>
                <div className="flex items-center mt-2">
                  <PhoneIcon className="h-5 w-5 text-blue-500" />
                  <Typography className="ml-2" style={{ fontFamily: "Montserrat" }}>
                    {user?.phone || "N/A"}
                  </Typography>
                </div>
                <div className="flex items-center mt-2">
                  <EnvelopeIcon className="h-5 w-5 text-blue-500" />
                  <Typography className="ml-2" style={{ fontFamily: "Montserrat" }}>
                    {user?.email || "N/A"}
                  </Typography>
                </div>
              </Card>

              {/* <Button
                className="flex items-center gap-2 bg-blue-500 h-fit"
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                <PencilIcon className="h-5 w-5" />
                Edit
              </Button> */}
            </div>
          </Card>

          <Card className="shadow-sm rounded-lg p-6 bg-white  w-1/2">
            <Typography variant="h6" className="font-bold text-blue-700" style={{ fontFamily: "Montserrat" }}>
              Change Password
            </Typography>
            <Typography variant="small" className="text-gray-500 mb-4" style={{ fontFamily: "Montserrat" }}>
              Change your password here by inserting your previous password.
            </Typography>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-1" />
                <Typography className="text-gray-700 font-medium" style={{ fontFamily: "Montserrat" }}>
                  Current Password <span className="text-red-500" style={{ fontFamily: "Montserrat" }}>*</span>
                </Typography>
              </div>
              <div className="relative w-2/3">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current password"
                  className="pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ fontFamily: "Montserrat" }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <hr className="border-gray-300 my-2" />

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-1" />
                <Typography className="text-gray-700 font-medium" style={{ fontFamily: "Montserrat" }}>
                  New Password <span className="text-red-500" style={{ fontFamily: "Montserrat" }}>*</span>
                </Typography>
              </div>
              <div className="relative w-2/3">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  className="pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ fontFamily: "Montserrat" }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 mb-6">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-1" />
                <Typography className="text-gray-700 font-medium" style={{ fontFamily: "Montserrat" }}>
                  Confirm Password <span className="text-red-500" style={{ fontFamily: "Montserrat" }}>*</span>
                </Typography>
              </div>
              <div className="w-2/3">
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ fontFamily: "Montserrat" }}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outlined"
                className="text-gray-600 border-gray-400"
                onClick={() => setShowChangePassword(false)}
                style={{ fontFamily: "Montserrat" }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-500" onClick={handleChangePassword} style={{ fontFamily: "Montserrat" }}>
                Change
              </Button>
            </div>

            {message && (
              <Typography
                variant="small"
                className={`mt-2 ${
                  message.includes("Error") ? "text-red-500" : "text-green-500"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                {message}
              </Typography>
            )}
          </Card>
        </div>
      </Card>
    </div>
  );
}

export default Profile;
