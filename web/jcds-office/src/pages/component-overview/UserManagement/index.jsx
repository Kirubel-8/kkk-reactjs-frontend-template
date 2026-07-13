import React, { useState, useEffect,useRef  } from "react";
import {List, ListItem, ListItemAvatar, ListItemText, Avatar,Link  , ListItemButton, ListItemIcon, Stack ,Card, CardContent,Grid, Divider,Accordion, AccordionSummary, AccordionDetails,Button, Paper, Typography, Box, Tabs,
  Snackbar,  Alert, Tab,  TextField, Badge , IconButton, InputAdornment,  } from "@mui/material";
import { Visibility, VisibilityOff, InfoOutlined } from "@mui/icons-material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";
import DevicesIcon from "@mui/icons-material/Devices";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LanguageIcon from "@mui/icons-material/Language";
import BrushIcon from "@mui/icons-material/Brush";
import { BadgeOutlined, Person, Settings, Notifications, Description } from "@mui/icons-material";
import { useStateContext } from '../../../routes/contextProvider';
// import authService from "../../../service/auth.service";
import { jwtDecode } from "jwt-decode";
import userService from '../../../service/user.service';
import { Phone, Email } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import { margin } from "@mui/system";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from 'react-router-dom';

const SwipeableStepper = () => {
  const editor = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const { token } = useStateContext();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
  current_password: "",
  password: "",
  confirm_password: "",
});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();
const [showPassword, setShowPassword] = useState({
  current: false,
  new: false,
  confirm: false,
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};


const togglePasswordVisibility = (field) => {
  setShowPassword((prevShowPassword) => ({
    ...prevShowPassword,
    [field]: !prevShowPassword[field],
  }));
};
const changePassword = async () => {
  try {
    const userData = {
      current_password: formData.current_password,
      password: formData.password,
      confirm_password: formData.confirm_password,
    };

    await userService.updateUserProfile(userData);

    setSnackbar({
      open: true,
      message: "Password changed successfully!",
      severity: "success",
    });

    setFormData({ current_password: "", password: "", confirm_password: "" });
  } catch (error) {
    setSnackbar({
      open: true,
      message: error.response?.data?.message || "Error changing password!",
      severity: "error",
    });
  }
};



const handleSubmit = (e) => {
  e.preventDefault();
  let validationErrors = {};


  if (!formData.current_password) {
    validationErrors.current_password = "Current password is required";
  }
  if (formData.password.length < 8) {
    validationErrors.password = "Password must be at least 8 characters";
  }
  if (formData.password !== formData.confirm_password) {
    validationErrors.confirm_password = "Passwords do not match";
  }

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  changePassword();
};

 const [errors, setErrors] = useState({});
  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    if (userToken) {
      const decodedToken = jwtDecode(userToken);
      const userId = decodedToken.id;

      const fetchUserProfile = async () => {
             try {
               const response = await userService.getUserProfile(userId);
               setUserProfile(response);
             } catch (error) {
               console.error('Error fetching user profile:', error);
             }
           };
      fetchUserProfile();
    } else {
      console.log("No token found");
    }
  }, []);
  
  const notifications = [
    {
      id: 1,
      user: "Solomon",
      title: "Document Assets: Rejection Reason",
      message: "Document image is not clearly uploaded. Please update with a clear image.",
      time: "8h",
      icon: <PersonIcon />,
      color: "primary",
    },
    {
      id: 2,
      title: "Important Alert!",
      message: "Please sign the paper at your earliest convenience. Thanks!",
      time: "14h",
      icon: <ErrorIcon color="error" />,
      action: "Sign",
    },
  ];
  const sessions = [
    { id: 1, device: "Samsung A14 phone", location: "Addis Ababa, Ethiopia" },
    { id: 2, device: "Dell phone", location: "Adama, Ethiopia" },
    { id: 3, device: "Samsung A14 phone", location: "Addis Ababa, Ethiopia" },
    { id: 4, device: "Dell phone", location: "Adama, Ethiopia" },
    { id: 5, device: "Samsung A14 phone", location: "Addis Ababa, Ethiopia" },
  ];
  const [selectedItem, setSelectedItem] = useState("phone"); // Default to 'phone'

  const steps = [
    {
      label: "Personal Info",
      content: (
        <Box>
          {userProfile ? (
              <Paper
                elevation={3}
                sx={{
                  padding: 3,
                  // maxWidth: 600,
                  // margin: "auto",
                  borderRadius: 3,
                  backgroundColor: "#F8F9FA",
                }}
              >
                <Typography fontWeight="bold" color="primary"sx={{borderLeft: "4px solid #416fe4", paddingLeft: 1}}>
                {userProfile && userProfile.roles && userProfile.roles.length > 0 ? (
                                userProfile.roles.map((role, index) => (
                                  <Typography key={index} variant="body2"sx={{fontSize:"18px"}}>
                                    {role.name}
                                  </Typography>
                                ))
                              ) : (
                                <Typography variant="body2" color="error">
                                  No roles assigned
                                </Typography>
                              )}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                    {t('user.full_name')}
                  </Typography>
                  <Typography variant="h5" color="black">
                    {userProfile?.full_name}
                  </Typography>
                  </Box>
                </Box>
          
               <Box sx={{mt:4}}>
                  <Typography variant="body1" fontWeight="bold" mb={1}fontSize={14}>
                    Contact Information
                  </Typography>
                  {/* <Box display="flex" alignItems="center" gap={1}>
                    <Phone color="primary" />
                    <Typography variant="body2">{userProfile?.phone}</Typography>
                  </Box> */}
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Email color="primary" />
                    <Typography variant="body2">{userProfile?.email}</Typography>
                  </Box>
                  </Box>
              </Paper>          
          ) : (
            <Typography variant="body1">Loading...</Typography>
          )}
        </Box>
      ),
      icon: <Person />,
    },
    {  
      label: "Account Settings", 
      content: (
        <Box sx={{ display: "flex", width: "100%", height: "80vh", p: 2 }}>
          {/* Left Side: Menu */}
          <Paper sx={{ width: 300, p: 2, mr: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {/* <ListItem disablePadding>
                <ListItemButton selected={selectedItem === "phone"} onClick={() => setSelectedItem("phone")}>
                  <ListItemIcon sx={{ mr: 2 }}><PhoneIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Phone number Privacy" />
                </ListItemButton>
              </ListItem>
              
              <ListItem disablePadding>
                <ListItemButton selected={selectedItem === "devices"} onClick={() => setSelectedItem("devices")}>
                  <ListItemIcon sx={{ mr: 2 }}><DevicesIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Logged in Devices" />
                </ListItemButton>
              </ListItem> */}
    
              <ListItem disablePadding>
                <ListItemButton selected={selectedItem === "password"} onClick={() => setSelectedItem("password")}>
                  <ListItemIcon sx={{ mr: 2 }}><LockIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Password" />
                </ListItemButton>
              </ListItem>
    
              {/* <ListItem disablePadding>
                <ListItemButton selected={selectedItem === "profile"} onClick={() => setSelectedItem("profile")}>
                  <ListItemIcon sx={{ mr: 2 }}><AccountCircleIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Edit Profile" />
                </ListItemButton>
              </ListItem> */}
            </List>
          </Paper> 
    
          {/* Right Side: Content Display */}
          <Paper sx={{ flexGrow: 1, p: 3 }}>
            {selectedItem === "phone" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>Phone number Privacy</Typography>
                <Typography variant="body1">Manage who can see your phone number.</Typography>
              </>
            )}
    
            {selectedItem === "devices" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>Logged in Devices</Typography>
                <Box sx={{ maxWidth: 600, mx: "auto", my: 4, p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 3 }}>
                  <Typography variant="h6" gutterBottom>Active Sessions</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    You can edit default notification policies and create new notification policies for your account.
                  </Typography>
                  {sessions.map((session) => (
                    <Card key={session.id} sx={{ display: "flex", alignItems: "center", mt: 2, p: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                        <DevicesIcon />
                      </Avatar>
                      <CardContent sx={{ flexGrow: 1, p: 0 }}>
                        <Typography variant="body1" fontWeight={600}>{session.device}</Typography>
                        <Typography variant="body2" color="textSecondary">{session.location}</Typography>
                      </CardContent>
                      <Button variant="contained" color="error" size="small">Terminate Session</Button>
                    </Card>
                  ))}
                </Box>
              </>
            )}
    
            {selectedItem === "password" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>Change Password</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Change your password here by inserting your previous password.
                </Typography>
                <Box sx={{ maxWidth: 500, p: 4, bgcolor: "white", borderRadius: 2, boxShadow: 3, mx: "auto" }}>
                <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <InfoOutlined color="primary" />
              </Grid>
              <Grid item xs>
                <Typography variant="body2">Current Password *</Typography>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              name="current_password"
              type={showPassword.current ? "text" : "password"}
              value={formData.current_password || ""}
              onChange={handleChange}
              error={!!errors.current_password}
              helperText={errors.current_password}
              sx={{ mt: 1, mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility("current")}>
                      {showPassword.current ? < Visibility/> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
              Forgot password?
            </Typography>
    
            {/* New Password */}
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <InfoOutlined color="primary" />
              </Grid>
              <Grid item xs>
                <Typography variant="body2">New Password *</Typography>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              name="password"
              type={showPassword.new ? "text" : "password"}
              value={formData.password || ""}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || "Eg. 8-digit password"}
              sx={{ mt: 1, mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility("new")}>
                      {showPassword.new ?< Visibility/> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
    
            {/* Confirm Password */}
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <InfoOutlined color="primary" />
              </Grid>
              <Grid item xs>
                <Typography variant="body2">Confirm Password *</Typography>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              name="confirm_password"
              type={showPassword.confirm ? "text" : "password"}
              value={formData.confirm_password || ""}
              onChange={handleChange}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password}
              sx={{ mt: 1, mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility("confirm")}>
                      {showPassword.confirm ? < Visibility/> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
    
            {/* Buttons */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button variant="outlined" color="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Change
              </Button>
            </Box>
                </form>
                </Box>
              </>
            )}
    
            {selectedItem === "profile" && (
              <>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>Edit Profilekkkk</Typography>
                <Typography variant="body1">Update your profile details.</Typography>
              </>
            )}
          </Paper>
        </Box>
      ),
      icon: <Settings />
    },
    
  // { 
  //     label: "Notifications",
  //     content: (
  //       <Box>
  //         <Card sx={{ maxWidth: 1000, boxShadow: 3, borderRadius: 2 }}>
  //           <CardContent>
  //             <Box display="flex" justifyContent="space-between" alignItems="center">
  //               <Typography fontWeight={"bold"} variant="h6">Notifications</Typography>
  //               <Link href="#" underline="hover" variant="body2" sx={{ cursor: "pointer" }}>
  //                 Mark all as read
  //               </Link>
  //             </Box>

  //             <Tabs value={0} indicatorColor="primary" textColor="black">
  //               <Tab
  //                 label={
  //                   <Badge color="black" badgeContent={notifications.length} showZero>
  //                     All
  //                   </Badge>
  //                 }
  //               />
  //             </Tabs>

  //             <List>
  //               {notifications.map((notification, index) => (
  //                 <React.Fragment key={notification.id}>
  //                   <ListItem alignItems="flex-start">
  //                     <ListItemAvatar>
  //                       <Avatar sx={{ bgcolor: "grey.300" }}>{notification.icon}</Avatar>
  //                     </ListItemAvatar>
  //                     <ListItemText
  //                       primary={
  //                         <Typography fontWeight="bold" variant="body1">
  //                           {notification.user ? `${notification.user} added a comment on` : ""}{" "}
  //                           <Typography component="span" fontWeight="bold" color="primary">
  //                             {notification.title}
  //                           </Typography>
  //                         </Typography>
  //                       }
  //                       secondary={
  //                         <>
  //                           <Typography variant="body2" color="textSecondary">
  //                             {notification.message}
  //                           </Typography>
  //                           <Typography variant="caption" display="block" color="textSecondary">
  //                             {notification.time}
  //                           </Typography>
  //                         </>
  //                       }
  //                     />
  //                     {notification.action && (
  //                       <Button variant="contained" size="small" sx={{ mt: 1 }}>
  //                         {notification.action}
  //                       </Button>
  //                     )}
  //                   </ListItem>
  //                   {index < notifications.length - 1 && <Divider variant="inset" />}
  //                 </React.Fragment>
  //               ))}
  //             </List>
  //           </CardContent>
  //         </Card>
  //       </Box>
  //      ), 
  //   icon: <Notifications />
  // },

    { label: "Documentation Guide", content: (
      <Grid container spacing={2} sx={{ padding: 2 }}>
        {/* Left Side - Accordion Sections */}
        <Grid item xs={12} md={8} sx={{ paddingRight: 2 }}>
          {/* First Accordion */}
          {/* <Accordion sx={{ boxShadow: "none", border: "1px solid #eee", borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: "48px" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                How to add Information?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                You can edit default notification policies and create new notification policies for account.
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1, textTransform: "none" }}>
                Expand
              </Button>
            </AccordionDetails>
          </Accordion> */}

          <Divider sx={{ my: 2 }} />

          {/* Second Accordion */}
          {/* <Accordion sx={{ boxShadow: "none", border: "1px solid #eee", borderRadius: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: "48px" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                How to get Assistant Information?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                You can edit default notification policies and create new notification policies for account.
              </Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1, textTransform: "none" }}>
                Expand
              </Button>
            </AccordionDetails>
          </Accordion> */}
        </Grid>

        {/* Right Side - Guide Documentation Titles */}
        {/* <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, backgroundColor: "#f8f9fc" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#3f51b5", mb: 1 }}>
              Guide Documentation Titles
            </Typography>
            <List>
              <ListItem selected sx={{ backgroundColor: "#e3e7ff", borderRadius: 1 }}>
                <ListItemText primary="How to add Info?" />
              </ListItem>
              {[
                "How to Renew License?",
                "How to add Representative information?",
                "How to add Personal Information?",
                "How to add Assistant information?",
              ].map((title, index) => (
                <ListItem key={index} button>
                  <ListItemText primary={title} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid> */}
      </Grid>
      ), icon: <Description />
    },
  ];

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  return (
    <Paper elevation={3} style={{ padding: 20, maxWidth: 950, margin: "auto", borderRadius: 10, backgroundColor: "#F0F0F0" }}>
       <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
              </Alert>
            </Snackbar>
      <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
        <BadgeOutlined fontSize="large" color="primary" />
        <Box>
          <Typography variant="h6" color="primary" fontWeight="bold">
            My Profile
          </Typography>
          <Typography variant="body2" color="textSecondary">
            All the information for the  {userProfile?.roles?.map((role, index) => (
                                  <span key={index} variant="body2">
                                    {role.name}
                                  </span>
            ))}                             
          </Typography>
        </Box>
      </Box>
      <Tabs
        value={activeStep}
        onChange={(e, newValue) => setActiveStep(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="profile tabs"
        sx={{
          "& .MuiTabs-indicator": {
            display: "none",
          },
        }}
      >
        {steps.map((step, index) => (
          <Tab
            key={index}
            label={step.label}
            icon={step.icon}
            iconPosition="start"
            sx={{
              textTransform: "none",
              mb: 1,
              paddingX: 2,
              marginX: 0.5,
              bgcolor: activeStep === index ? "rgba(65, 111, 228, 0.16)" : "transparent",
              color: activeStep === index ? "#416fe4" : "inherit",
              "&:hover": {
                bgcolor: "rgba(65, 111, 228, 0.3)",
              },
            }}
          />
        ))}
      </Tabs>
      <Box sx={{}}>
        <Typography variant="body1" style={{ marginTop: 10 }}>{steps[activeStep].content}</Typography>
      </Box>
    </Paper>
  );
};

export default SwipeableStepper;
