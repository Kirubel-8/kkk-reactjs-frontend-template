import { useAuth } from "@/authContext";
import { useMaterialTailwindController } from "@/context";
import { useLoading } from "@/loading-context";
import customerAuthService from "@/service/customer-auth.service";
import notificationService from "@/service/notification.service";
import RequestService from "@/service/request.service";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  InboxIcon,
  UserCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { PiGlobeHemisphereEast } from "react-icons/pi";
import { IoIosNotificationsOutline } from "react-icons/io";
import {
  Avatar,
  Button,
  Drawer,
  IconButton,
  Input,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  Navbar,
  Typography,
} from "@material-tailwind/react";
import { format } from "date-fns";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../config";
import jcdmsLogo from "../../assets/images/jcdms-logo.png";
import navbarLogo from "../../assets/images/navbar logo.png";
import logoNewJcdms from "../../assets/images/logo_new_jcdms.png";

const menuItems = [];

export function DashboardNavbar() {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const [userProfile, setUserProfile] = useState(null);
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
  const { logout } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const customerAccountToken = localStorage.getItem("customerAccountToken");
  const [open, setOpen] = useState(true);
  const [notificationItems, setNotificationItems] = useState(menuItems);
  const [hasReadNotifications, setHasReadNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasRequests, setHasRequests] = useState(false);

  const navigate = useNavigate();

  const fetchNotificationsFromDB = async (userId) => {
    try {
      const notifications = await notificationService.getUserNotifications(userId);
      const formattedNotifications = notifications.map((notification) => ({
        id: notification.notification_id,
        case_id: notification.case_id,
        complaint_id: notification.complaint_id,
        icon: (
          <div className="grid h-[clamp(32px,3.33vh,36px)] w-[clamp(32px,1.88vw,36px)] place-items-center rounded-full bg-gradient-to-tr from-blue-gray-800 to-blue-gray-900">
            <InboxIcon className="h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)] text-white" />
          </div>
        ),
        text: notification.title
          ? `${notification.title} ${notification.message ?? ""}`.trim()
          : notification.message,
        timestamp: format(new Date(notification.createdAt), "MMMM dd, yyyy HH:mm:ss"),
        iconElement: <ClockIcon className="h-[clamp(12px,0.65vw,14px)] w-[clamp(12px,0.65vw,14px)]" />,
        isRead: notification.is_read,
      }));

      setNotificationItems(formattedNotifications);
      setUnreadCount(notifications.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationsAsRead = async (userId) => {
    try {
      await notificationService.markNotificationsAsRead(userId);
      // Refresh notifications after marking all as read
      await fetchNotificationsFromDB(userId);
      setHasReadNotifications(true);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const markSingleNotificationAsRead = async (userId, notificationId) => {
    try {
      await notificationService.markNotificationAsRead(userId, notificationId);
      // Refresh notifications after marking single notification as read
      await fetchNotificationsFromDB(userId);
    } catch (error) {
      console.error("Error marking single notification as read:", error);
    }
  };

  useEffect(() => {
    const customerAccountToken = localStorage.getItem("customerAccountToken");

    if (!customerAccountToken) {
      console.error("No customer account token found");
      return;
    }

    const decodedToken = jwtDecode(customerAccountToken);
    const userId = decodedToken.id;

    fetchNotificationsFromDB(userId);

    const socket = io(SOCKET_URL, {
      query: { userId },
    });

    socket.on("notification", (notification) => {
      const formattedDate = format(
        new Date(notification.createdAt || Date.now()),
        "MMMM dd, yyyy HH:mm:ss"
      );

      setNotificationItems((prevItems) => {
        const newNotification = {
          id: notification.notification_id,
          case_id: notification.case_id,
          complaint_id: notification.complaint_id,
          icon: (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-blue-gray-800 to-blue-gray-900">
              <InboxIcon className="h-4 w-4 text-white" />
            </div>
          ),
          text: notification.title
            ? `${notification.title} ${notification.message ?? ""}`.trim()
            : notification.message,
          timestamp: formattedDate,
          iconElement: <ClockIcon className="h-[clamp(12px,0.65vw,14px)] w-[clamp(12px,0.65vw,14px)]" />,
          isRead: false,
        };

        const updatedNotifications = [newNotification, ...prevItems];
        setUnreadCount((count) => count + 1);
        return updatedNotifications;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (customerAccountToken) {
      const decodedToken = jwtDecode(customerAccountToken);
      const userId = decodedToken.id;

      const fetchUserProfile = async () => {
        try {
          const response = await customerAuthService.getCustomerById(userId);
          setUserProfile(response.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    } else {
      console.log("No token found");
    }
  }, [customerAccountToken]);

  useEffect(() => {
    const checkUserRequests = async () => {
      if (customerAccountToken) {
        try {
          const decodedToken = jwtDecode(customerAccountToken);
          const customerId = decodedToken.id;

          // Check for disciplinary requests
          const disciplinaryData = await RequestService.getDisciplinaryRequestsByCustomerId(customerId, { limit: 1 });
          const hasDisciplinary = disciplinaryData.discliplinary_complaints && disciplinaryData.discliplinary_complaints.length > 0;

          // Check for complaint requests
          const complaintData = await RequestService.getComplaintRequestsByCustomerId(customerId, { limit: 1 });
          // Handle different possible response structures
          const hasComplaint = (complaintData.data && complaintData.data.length > 0) || 
                              (complaintData.complaints && complaintData.complaints.length > 0) ||
                              (complaintData.discliplinary_complaints && complaintData.discliplinary_complaints.length > 0);

          setHasRequests(hasDisciplinary || hasComplaint);
        } catch (error) {
          console.error("Error checking user requests:", error);
          setHasRequests(false);
        }
      } else {
        setHasRequests(false);
      }
    };
    checkUserRequests();
  }, [customerAccountToken, pathname]);

  const handleBellClick = (e) => {
    const customerAccountToken = localStorage.getItem("customerAccountToken");
    if (!customerAccountToken) return;

    const decodedToken = jwtDecode(customerAccountToken);
    fetchNotificationsFromDB(decodedToken.id);
  };

  const handleLogout = async () => {
    const delay = 2000;

    try {
      startLoading();

      await new Promise((resolve) => setTimeout(resolve, delay));

      await logout();
      stopLoading();
    } catch (error) {
      console.log(error);
      stopLoading();
    }
  };

  const handleProfileClick = () => {
    startLoading();
    setTimeout(() => {
      navigate("/home/profile");
      stopLoading();
    }, 500);
  };

  const handleNotificationClick = async (item) => {
    // Mark notification as read before navigating
    const customerAccountToken = localStorage.getItem("customerAccountToken");
    if (customerAccountToken && item.id) {
      try {
        const decodedToken = jwtDecode(customerAccountToken);
        const userId = decodedToken.id;
        await markSingleNotificationAsRead(userId, item.id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
        // Continue with navigation even if marking as read fails
      }
    }

    // Navigate to the appropriate detail page
    if (item.complaint_id) {
      // Navigate to disciplinary case detail
      // complaint_id refers to disciplinary_complaint_id
      startLoading();
      setTimeout(() => {
        const shortId = item.complaint_id.toString().substring(0, 8);
        navigate(`/home/new-disciplinary-details/${shortId}`, {
          state: { fullRequestId: item.complaint_id },
        });
        stopLoading();
      }, 100);
    } else if (item.case_id) {
      // Navigate to complaint case detail
      // For complaint cases, we use case_id as the complaint_id
      startLoading();
      setTimeout(() => {
        navigate(`/home/complaint-details-v3/${item.case_id}`, {
          state: { fullComplaintId: item.case_id },
        });
        stopLoading();
      }, 100);
    }
  };

  const handleLogoClick = () => {
    startLoading();
    setTimeout(() => {
      navigate("/home/requests");
      window.location.reload();
      stopLoading();
    }, 500);
  };

  const languageOptions = [
    {
      code: "en",
      label: "English",
      // flag: "/cfms-customer/img/Flag_of_the_United_States_(Pantone).svg",
      flag:"https://flagcdn.com/w40/us.png",
    },
    {
      code: "አማ",
      label: "አማርኛ",
      // flag: "/cfms-customer/img/Flag_of_Ethiopia.svg",
      flag: "https://flagcdn.com/w40/et.png",
    },
  ];
  useEffect(() => {
    i18n.changeLanguage("en");
  }, [i18n]);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    changeLanguage(language);
    setOpen(false);
  };
  return (
    <Navbar
      color="white"
      className="transition-all h-full min-h-[clamp(80px,10.74vh,116px)] w-full bg-white sticky z-40 py-[clamp(8px,0.74vh,12px)] shadow-[0_0_12px_0_#0000001F] ml-0 pl-[clamp(8px,2.5vw,96px)] pr-[clamp(8px,2.5vw,96px)]"
      fullWidth
      blurred={false}
    >
      <div className="flex justify-between items-center gap-[clamp(8px,0.83vw,24px)] h-full relative">
        {/* Left side - Drawer button (mobile only) */}
        <div className="lg:hidden flex items-center">
          <IconButton
            variant="text"
            color="blue-gray"
            onClick={handleDrawerToggle}
          >
            <Bars3Icon className="h-[clamp(20px,1.25vw,24px)] w-[clamp(20px,1.25vw,24px)] text-blue-gray-500" />
          </IconButton>
        </div>

        {/* Logo - centered on mobile, left-aligned on desktop */}
        <div
          className="flex items-center cursor-pointer absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-0 lg:transform-none"
          onClick={handleLogoClick}
        >
          <img
            src={logoNewJcdms}
            alt="FJACS Logo"
            className="transition-all object-contain w-full max-w-[clamp(200px,22.5vw,432px)] h-auto max-h-[clamp(40px,5.83vh,63px)]"
            style={{ opacity: 1 }}
          />
        </div>

        {/* Desktop menu items - shown only at lg and above */}
        <div className="hidden lg:flex items-center gap-[clamp(16px,1.67vw,32px)]">
          <Button
            variant="text"
              className={`normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
              pathname === "/home/landing"
                ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
            }`}
            onClick={() => {
              navigate("/home/landing");
            }}
          >
            Home
          </Button>
          {hasRequests && (
            <Button
              variant="text"
              className={`normal-case text-base leading-[25px] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 whitespace-nowrap ${
                pathname === "/home/requests"
                  ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                  : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
              }`}
              onClick={() => {
                navigate("/home/requests");
              }}
            >
              My complaint
            </Button>
          )}
          <Button
            variant="text"
              className={`normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
              pathname === "/home/announcement"
                ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
            }`}
            onClick={() => {
              navigate("/home/announcement");
            }}
          >
            Announcement
          </Button>
          <Button
            variant="text"
              className={`normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
              pathname === "/home/faq"
                ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
            }`}
            onClick={() => {
              navigate("/home/faq");
            }}
          >
            FAQ
          </Button>
        </div>

        <div className="flex items-center">
          {/* Desktop icons - shown only at lg and above */}
          <div className="hidden lg:flex items-center gap-[clamp(8px,0.42vw,8px)]">
            <Menu>
              <MenuHandler>
                <IconButton variant="text" color="blue-gray">
                  <PiGlobeHemisphereEast 
                    className="w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)]"
                    style={{ color: '#4D5154' }} 
                  />
                </IconButton>
              </MenuHandler>
              <MenuList className="w-max border-0 bg-white rounded-lg shadow-md overflow-hidden">
                {languageOptions.map((option) => (
                  <MenuItem
                    key={option.code}
                    className="flex items-center gap-[clamp(10px,0.52vw,12px)] px-[clamp(12px,0.83vw,16px)] py-[clamp(6px,0.52vw,8px)] hover:bg-gray-100 rounded-lg transition-all duration-200"
                    onClick={() => handleLanguageSelect(option.code)}
                  >
                    <img
                      src={option.flag}
                      alt={option.label}
                      className="h-6 w-6 rounded-full"
                    />
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {option.label}
                    </Typography>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            <Menu>
              <MenuHandler>
                <div className="relative">
                  <IconButton
                    variant="text"
                    color="blue-gray"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBellClick();
                    }}
                  >
                    <IoIosNotificationsOutline className="h-[clamp(18px,1.04vw,20px)] w-[clamp(18px,1.04vw,20px)]" style={{ color: '#4D5154' }} />
                  </IconButton>
                  {unreadCount > 0 && (
                    <div 
                      className="absolute top-0 right-0 flex items-center justify-center w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] rounded-full text-white text-[clamp(10px,0.73vw,12px)]"
                      style={{ backgroundColor: 'var(--FJACS-main, #215167)' }}
                    >
                      {unreadCount}
                    </div>
                  )}
                </div>
              </MenuHandler>
              <MenuList className="w-max border-0">
                <div className="flex justify-between items-center px-[clamp(12px,0.83vw,16px)] py-[clamp(6px,0.52vw,8px)] border-b">
                  <Typography 
                    variant="h6" 
                    color="blue-gray"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Button
                      variant="text"
                      size="sm"
                      className="flex items-center gap-[clamp(4px,0.21vw,4px)] p-[clamp(4px,0.21vw,4px)]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                      onClick={() => {
                        const customerAccountToken = localStorage.getItem(
                          "customerAccountToken"
                        );
                        if (!customerAccountToken) return;
                        const decodedToken = jwtDecode(customerAccountToken);
                        markNotificationsAsRead(decodedToken.id);
                      }}
                    >
                      <CheckCircleIcon className="h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)]" />
                      <span style={{ fontFamily: "'Montserrat', sans-serif" }}>Mark all as read</span>
                    </Button>
                  )}
                </div>

                {notificationItems.length === 0 ? (
                  <MenuItem className="flex items-center justify-center">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      No notifications
                    </Typography>
                  </MenuItem>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notificationItems.map((item, index) => (
                      <MenuItem
                        key={index}
                        className={`flex items-start my-[clamp(6px,0.42vw,8px)] gap-[clamp(8px,0.42vw,8px)] py-[clamp(6px,0.52vw,8px)] px-[clamp(10px,0.52vw,12px)] w-full max-w-[clamp(200px,20.83vw,448px)] ${!item.isRead ? "bg-blue-gray-50" : ""
                          } ${item.case_id || item.complaint_id ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (item.case_id || item.complaint_id) {
                            handleNotificationClick(item);
                          }
                        }}
                      >
                        {item.avatar ? (
                          <Avatar
                            src={item.avatar}
                            alt={item.alt}
                            size="sm"
                            variant="circular"
                            className="shrink-0"
                          />
                        ) : (
                          <div className="shrink-0">{item.icon}</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="mb-1 font-normal break-words"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {item.text}
                          </Typography>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="flex items-center gap-[clamp(4px,0.21vw,4px)] text-[clamp(10px,0.73vw,12px)] font-normal opacity-60 flex-wrap"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {item.iconElement} {item.timestamp}
                          </Typography>
                        </div>
                        {!item.isRead && (
                          <IconButton
                            variant="text"
                            size="sm"
                            color="blue-gray"
                            onClick={(e) => {
                              e.stopPropagation();
                              const customerAccountToken = localStorage.getItem(
                                "customerAccountToken"
                              );
                              if (!customerAccountToken) return;
                              const decodedToken = jwtDecode(customerAccountToken);
                              markSingleNotificationAsRead(decodedToken.id, item.id);
                            }}
                          >
                            <CheckIcon className="h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)]" />
                          </IconButton>
                        )}
                      </MenuItem>
                    ))}
                  </div>
                )}
              </MenuList>
            </Menu>
            <div className="w-[clamp(0.5px,0.05vw,1px)] max-h-[clamp(36px,4.17vh,44px)] h-full bg-[#C2C2C2] bg-opacity-50 rounded-lg mx-[clamp(8px,0.42vw,8px)]" />

            <Menu>
              <MenuHandler>
            <Button
              variant="text"
              color="blue-gray"
              className="flex items-center gap-[clamp(8px,0.42vw,8px)] px-[clamp(12px,0.83vw,16px)] normal-case overflow-visible flex-shrink-0"
            >
              <div className="flex flex-col items-end min-w-0 flex-shrink-0">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="[font-family:Montserrat] font-semibold text-[clamp(13px,0.78vw,15px)] leading-[clamp(18px,2.04vh,22px)] [letter-spacing:0px] text-[#4D5154] whitespace-nowrap text-right"
                >
                  {userProfile ? userProfile.full_name : null}
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="[font-family:Montserrat] font-medium text-[clamp(11px,0.68vw,13px)] leading-[clamp(16px,1.85vh,20px)] [letter-spacing:0px] text-right text-[#A6A8A9]"
                >
                  {t("navbar.role")}
                </Typography>
              </div>
              <UserCircleIcon 
                className="w-full max-w-[clamp(32px,1.98vw,38px)] h-full max-h-[clamp(32px,3.52vh,38px)] rounded-full"
                style={{
                  opacity: 1,
                  color: 'var(--FJACS-main, #215167)'
                }}
              />
            </Button>
              </MenuHandler>
              <MenuList className="w-max border-0 bg-white rounded-lg shadow-md overflow-hidden">
                <MenuItem
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  onClick={handleProfileClick}
                >
                  <PencilIcon className="h-[clamp(18px,1.04vw,20px)] w-[clamp(18px,1.04vw,20px)]" style={{ color: '#4D5154' }} />
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Edit Profile
                  </Typography>
                </MenuItem>
                <MenuItem
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  onClick={handleLogout}
                >
                  <ArrowRightOnRectangleIcon className="h-[clamp(18px,1.04vw,20px)] w-[clamp(18px,1.04vw,20px)]" style={{ color: '#4D5154' }} />
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Logout
                  </Typography>
                </MenuItem>
              </MenuList>
            </Menu>
          </div>

          {/* Spacer for mobile to balance the drawer button */}
          <div className="lg:hidden w-[clamp(32px,2.08vw,40px)]" />
          </div>

          {/* Drawer - shown only from sm to md */}
          <Drawer
          anchor="left"
            open={drawerOpen}
            onClose={handleDrawerToggle}
            className="lg:hidden"
          >
            <div className="flex flex-col p-[clamp(12px,0.83vw,16px)] space-y-[clamp(6px,0.42vw,8px)] w-full max-w-[clamp(200px,20.83vw,320px)]">
              <Button
                variant="text"
                color="blue-gray"
                className="flex gap-[clamp(10px,0.52vw,12px)] items-center"
                onClick={() => {
                  handleDrawerToggle();
                  handleProfileClick();
                }}
              >
                <UserCircleIcon 
                  className="w-full max-w-[38px] h-full max-h-[38px] rounded-full"
                  style={{
                    opacity: 1,
                    color: 'var(--FJACS-main, #215167)'
                  }}
                />

                <Typography 
                  variant="small" 
                  color="blue-gray"
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: 600,
                    fontSize: '15px',
                    lineHeight: '22px',
                    letterSpacing: '0px',
                    color: '#4D5154'
                  }}
                >
                  {userProfile ? userProfile.full_name : "Profile"}
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: 500,
                    fontSize: '13px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    textAlign: 'right',
                    color: '#A6A8A9'
                  }}
                >
                  ({t("navbar.role")})
                </Typography>
              </Button>

              <Button
                variant="text"
                color="blue-gray"
                className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                  pathname === "/home/landing"
                    ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                    : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
                }`}
                onClick={() => {
                  handleDrawerToggle();
                  navigate("/home/landing");
                }}
              >
                <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Home
                </Typography>
              </Button>

              {hasRequests && (
                <Button
                  variant="text"
                  color="blue-gray"
                  className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                    pathname === "/home/requests"
                      ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                      : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
                  }`}
                  onClick={() => {
                    handleDrawerToggle();
                    navigate("/home/requests");
                  }}
                >
                  <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    My complaint
                  </Typography>
                </Button>
              )}

              <Button
                variant="text"
                color="blue-gray"
                className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                  pathname === "/home/announcement"
                    ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                    : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
                }`}
                onClick={() => {
                  handleDrawerToggle();
                  navigate("/home/announcement");
                }}
              >
                <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Announcement
                </Typography>
              </Button>

              <Button
                variant="text"
                color="blue-gray"
                className={`flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start normal-case text-base leading-[clamp(20px,2.31vh,25px)] tracking-normal hover:bg-transparent hover:shadow-none hover:opacity-100 ${
                  pathname === "/home/faq"
                    ? "font-['Montserrat'] font-bold text-[#265169] hover:text-[#265169]"
                    : "font-['Montserrat'] font-medium text-[#07395480] hover:text-[#07395480]"
                }`}
                onClick={() => {
                  handleDrawerToggle();
                  navigate("/home/faq");
                }}
              >
                <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  FAQ
                </Typography>
              </Button>

              <div className="w-full h-[clamp(0.5px,0.05vh,1px)] bg-[#C2C2C2] bg-opacity-50 rounded-lg my-[clamp(6px,0.42vw,8px)]" />

              <Menu>
                <MenuHandler>
                  <Button
                    variant="text"
                    color="blue-gray"
                    className="flex gap-[clamp(10px,0.52vw,12px)] items-center justify-start"
                  >
                    <PiGlobeHemisphereEast 
                      className="w-full max-w-[clamp(16px,1.02vw,19.5px)] h-full max-h-[clamp(16px,1.81vh,19.5px)]"
                      style={{ color: '#4D5154' }} 
                    />
                    <Typography 
                      variant="small" 
                      color="blue-gray"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Language
                    </Typography>
                  </Button>
                </MenuHandler>
                <MenuList className="w-max border-0 bg-white rounded-lg shadow-md overflow-hidden">
                  {languageOptions.map((option) => (
                    <MenuItem
                      key={option.code}
                      className="flex items-center gap-[clamp(10px,0.52vw,12px)] px-[clamp(12px,0.83vw,16px)] py-[clamp(6px,0.52vw,8px)] hover:bg-gray-100 rounded-lg transition-all duration-200"
                      onClick={() => {
                        handleLanguageSelect(option.code);
                        handleDrawerToggle();
                      }}
                    >
                      <img
                        src={option.flag}
                        alt={option.label}
                        className="h-[clamp(20px,1.25vw,24px)] w-[clamp(20px,1.25vw,24px)] rounded-full"
                      />
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-medium"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {option.label}
                      </Typography>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>

              <Menu>
                <MenuHandler>
                  <div className="relative w-full">
                    <Button
                      variant="text"
                      color="blue-gray"
                      className="flex gap-3 items-center justify-start w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBellClick();
                      }}
                    >
                      <IoIosNotificationsOutline className="h-[clamp(18px,1.04vw,20px)] w-[clamp(18px,1.04vw,20px)]" style={{ color: '#4D5154' }} />
                      <Typography 
                        variant="small" 
                        color="blue-gray"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        Notifications
                      </Typography>
                      {unreadCount > 0 && (
                        <div 
                          className="ml-auto flex items-center justify-center w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] rounded-full text-white text-[clamp(10px,0.73vw,12px)]"
                          style={{ backgroundColor: 'var(--FJACS-main, #215167)' }}
                        >
                          {unreadCount}
                        </div>
                      )}
                    </Button>
                  </div>
                </MenuHandler>
                <MenuList className="w-max border-0">
                  <div className="flex justify-between items-center px-[clamp(12px,0.83vw,16px)] py-[clamp(6px,0.52vw,8px)] border-b">
                    <Typography 
                      variant="h6" 
                      color="blue-gray"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Button
                        variant="text"
                        size="sm"
                        className="flex items-center gap-[clamp(4px,0.21vw,4px)] p-[clamp(4px,0.21vw,4px)]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                        onClick={() => {
                          const customerAccountToken = localStorage.getItem(
                            "customerAccountToken"
                          );
                          if (!customerAccountToken) return;
                          const decodedToken = jwtDecode(customerAccountToken);
                          markNotificationsAsRead(decodedToken.id);
                        }}
                      >
                        <CheckCircleIcon className="h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)]" />
                        <span style={{ fontFamily: "'Montserrat', sans-serif" }}>Mark all as read</span>
                      </Button>
                    )}
                  </div>

                  {notificationItems.length === 0 ? (
                    <MenuItem className="flex items-center justify-center">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        No notifications
                      </Typography>
                    </MenuItem>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notificationItems.map((item, index) => (
                        <MenuItem
                          key={index}
                          className={`flex items-start my-2 gap-2 py-2 px-3 w-full max-w-xs sm:max-w-sm md:max-w-md ${!item.isRead ? "bg-blue-gray-50" : ""
                            } ${item.case_id || item.complaint_id ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            if (item.case_id || item.complaint_id) {
                              handleNotificationClick(item);
                              handleDrawerToggle();
                            }
                          }}
                        >
                          {item.avatar ? (
                            <Avatar
                              src={item.avatar}
                              alt={item.alt}
                              size="sm"
                              variant="circular"
                              className="shrink-0"
                            />
                          ) : (
                            <div className="shrink-0">{item.icon}</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="mb-1 font-normal break-words"
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {item.text}
                            </Typography>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="flex items-center gap-[clamp(4px,0.21vw,4px)] text-[clamp(10px,0.73vw,12px)] font-normal opacity-60 flex-wrap"
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {item.iconElement} {item.timestamp}
                            </Typography>
                          </div>
                          {!item.isRead && (
                            <IconButton
                              variant="text"
                              size="sm"
                              color="blue-gray"
                              onClick={(e) => {
                                e.stopPropagation();
                                const customerAccountToken = localStorage.getItem(
                                  "customerAccountToken"
                                );
                                if (!customerAccountToken) return;
                                const decodedToken = jwtDecode(customerAccountToken);
                                markSingleNotificationAsRead(decodedToken.id, item.id);
                              }}
                            >
                              <CheckIcon className="h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)]" />
                            </IconButton>
                          )}
                        </MenuItem>
                      ))}
                    </div>
                  )}
                </MenuList>
              </Menu>

              <Button
                variant="text"
                color="blue-gray"
                className="flex gap-3 items-center justify-start"
                onClick={() => {
                  handleDrawerToggle();
                  handleLogout();
                }}
              >
                <ArrowRightOnRectangleIcon className="h-[clamp(18px,1.04vw,20px)] w-[clamp(18px,1.04vw,20px)] text-blue-gray-500" />
                <Typography variant="small" color="blue-gray" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Logout
                </Typography>
              </Button>
            </div>
          </Drawer>

      </div>
    </Navbar>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
