import {
  ForgotPassword,
  ResetPassword,
  SignIn,
  SignInNew,
  SignUp,
  SignUpNew,
  VerifyOtp,
} from "@/pages/auth";
import {
  ApplicantDetail,
  Home,
  NewRequestForm,
  Notifications,
  Profile,
  Tables,
} from "@/pages/requestManagement";
import LandingPage from "@/pages/requestManagement/landing-page";
import FAQPage from "@/pages/requestManagement/faq";
import AnnouncementPage from "@/pages/requestManagement/announcement";
import EditRequestForm from "@/pages/requestManagement/edit-request";
import {
  FolderMinusIcon,
  HomeIcon,
  InformationCircleIcon,
  RectangleStackIcon,
  ServerStackIcon,
  TableCellsIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import RequestDetails from "./pages/requestManagement/expanded-request";
import CaseDecision from "./pages/caseDecision/CaseDecision";
import { DisciplinaryCaseReportingForm, ViewDetailDisciplinary, EditDisciplinary, NewDisciplinaryRequestForm, NewViewDisciplinaryDetail, NewEditDisciplinary } from "./pages/disciplinaryCase";
import { ComplaintRequestForm, ViewDetailComplaint, EditComplaint, NewComplaintRequestForm, ViewDetailComplaint3, NewEditComplaint } from "./pages/complaintCase";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "home",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "Landing",
        path: "/landing",
        element: <LandingPage />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "FAQ",
        path: "/faq",
        element: <FAQPage />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "Announcement",
        path: "/announcement",
        element: <AnnouncementPage />,
      },
      {
        icon: <FolderMinusIcon {...icon} />,
        name: "Requests",
        path: "/requests",
        element: <Home />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "request details",
        path: "/request-details/:requestId",
        element: <RequestDetails />,
      },

      {
        icon: <HomeIcon {...icon} />,
        name: "add new request",
        path: "/new-request",
        element: <NewRequestForm />,
      },

      {
        icon: <HomeIcon {...icon} />,
        name: "edit request",
        path: "/edit-request",
        element: <EditRequestForm />,
      },
      {
        icon: <HomeIcon {...icon} />,
        name: "edit request",
        path: "/edit-request/:shortRequestId",
        element: <EditRequestForm />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "tables",
        path: "/tables",
        element: <Tables />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "notifications",
        path: "/notifications",
        element: <Notifications />,
      },
      {
        icon: <HomeIcon {...icon} />,
        name: "request detail",
        path: "/request-detail/:shortRequestId",
        element: <ApplicantDetail />,
      },
      {
        icon: <HomeIcon {...icon} />,
        name: "case decisiom",
        path: "/case-decision",
        element: <CaseDecision />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "disciplinary case",
        path: "/disciplinary-request",
        element: <DisciplinaryCaseReportingForm />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "disciplinary request details",
        path: "/disciplinary-request-details/:shortRequestId",
        element: <ViewDetailDisciplinary />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "edit disciplinary request",
        path: "/edit-disciplinary-request/:shortRequestId",
        element: <EditDisciplinary />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "new disciplinary request",
        path: "/new-disciplinary-request",
        element: <NewDisciplinaryRequestForm />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "new disciplinary detail",
        path: "/new-disciplinary-details/:requestId",
        element: <NewViewDisciplinaryDetail />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "new edit disciplinary",
        path: "/new-edit-disciplinary/:requestId",
        element: <NewEditDisciplinary />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "complaint request",
        path: "/complaint-request",
        element: <ComplaintRequestForm />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "new complaint request",
        path: "/new-complaint-request",
        element: <NewComplaintRequestForm />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "complaint request details",
        path: "/complaint-request-details/:complaintId",
        element: <ViewDetailComplaint />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "complaint request details v3",
        path: "/complaint-details-v3/:complaintId",
        element: <ViewDetailComplaint3 />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "edit complaint request",
        path: "/edit-complaint-request/:complaintId",
        element: <EditComplaint />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "new edit complaint",
        path: "/edit-complaint-v3/:complaintId",
        element: <NewEditComplaint />,
      },
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in new",
        path: "/sign-in-new",
        element: <SignInNew />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up new",
        path: "/sign-up-new",
        element: <SignUpNew />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "forget password",
        path: "/forget-password",
        element: <ForgotPassword />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "reset password",
        path: "/reset-password",
        element: <ResetPassword />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "verify otp",
        path: "/verify-otp",
        element: <VerifyOtp />,
      },
    ],
  },
];

export default routes;
