// Routes.js
import { Auth, Dashboard, Public } from "@/layouts";
import LandingPage from "@/pages/landing/LandingPage";
import About from "@/pages/landing/About";
import FAQ from "@/pages/landing/FAQ";
import ContactUs from "@/pages/landing/ContactUs";
import MainLandingPage from "@/pages/requestManagement/main-landing";
import FAQPublic from "@/pages/requestManagement/faq-public";
import AnnouncementPublic from "@/pages/requestManagement/announcement-public";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "@/ProtectedRoute";
import { DisciplinaryCaseReportingForm, DisciplinaryCaseReportingForm2, DisciplinaryReportingForm3, ViewDetailDisciplinary2 } from "@/pages/disciplinaryCase";
import EditDisciplinary2 from "@/pages/disciplinaryCase/editDisciplinary2";
import { ComplaintRequestForm, ComplaintRequestForm2, ComplaintRequestForm3, ViewDetailComplaint2 } from "@/pages/complaintCase";
import EditComplaintV2 from "@/pages/complaintCase/editComplaint-v2";
import NewRequest from "@/pages/newRequest/newRequest-modal";

const Routes = [
  {
    path: "/main-landing",
    element: (
      <Public>
        <MainLandingPage />
      </Public>
    ),
  },
  {
    path: "/",
    // element: <LandingPage />,
    element: (
      <Public>
        <MainLandingPage />
      </Public>
    ),
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/faq",
    element: (
      <Public>
        <FAQPublic />
      </Public>
    ),
  },
  {
    path: "/announcement",
    element: (
      <Public>
        <AnnouncementPublic />
      </Public>
    ),
  },
  {
    path: "/contact",
    element: <ContactUs />,
  },
  {
    path: "/home/new-request",
    element: <NewRequest />,
  },
  {
    path: "/home/disciplinary-request",
    element: <DisciplinaryCaseReportingForm />,
  },
  {
    path: "/home/disciplinary-request-v2",
    element: <DisciplinaryCaseReportingForm2 />,
  },
  {
    path: "/home/disciplinary-request-v3",
    element: <DisciplinaryReportingForm3 />,
  },
  {
    path: "/home/complaint-request",
    element: <ComplaintRequestForm />,
  },
  {
    path: "/home/complaint-request-v2",
    element: <ComplaintRequestForm2 />,
  },
  {
    path: "/home/complaint-request-v3",
    element: <ComplaintRequestForm3 />,
  },
  {
    path: "/home/complaint-details-v2/:complaintId",
    element: <ViewDetailComplaint2 />,
  },
  {
    path: "/home/disciplinary-details-v2/:shortRequestId",
    element: <ViewDetailDisciplinary2 />,
  },
  {
    path: "/home/edit-complaint-request-v2/:complaintId",
    element: <EditComplaintV2 />,
  },
  {
    path: "/home/edit-disciplinary-request-v2/:shortRequestId",
    element: <EditDisciplinary2 />,
  },
  {
    path: "/landing",
    element: (
      <ProtectedRoute>
        <Navigate to="/home/landing" replace />
      </ProtectedRoute>
    ),
  },
  {
    path: "/home/*",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth/*",
    element: <Auth />,
  },
  {
    path: "*",
    element: <Navigate to="/auth/sign-in-new" replace />,
  },
];

export default Routes;
