import NotFound from "@/NotFound";
import routes from "@/routes";
import { Footer } from "@/widgets/layout";
import {
  ArrowRightOnRectangleIcon,
  ChartPieIcon,
  UserIcon,
  UserPlusIcon,
} from "@heroicons/react/24/solid";
import { Route, Routes } from "react-router-dom";

export function Auth() {
  const navbarRoutes = [
    {
      name: "dashboard",
      path: "/dashboard/home",
      icon: ChartPieIcon,
    },
    {
      name: "profile",
      path: "/dashboard/home",
      icon: UserIcon,
    },
    {
      name: "sign up",
      path: "/auth/sign-up",
      icon: UserPlusIcon,
    },
    {
      name: "sign in",
      path: "/auth/sign-in-new",
      icon: ArrowRightOnRectangleIcon,
    },
    {
      name: "forget password",
      path: "/auth/forget-password",
      icon: ArrowRightOnRectangleIcon,
    },
    {
      name: "reset password",
      path: "/auth/reset-password",
      icon: ArrowRightOnRectangleIcon,
    },
    {
      name: "verify otp",
      path: "/auth/verify-otp",
      icon: ArrowRightOnRectangleIcon,
    },
  ];

  return (
<div className="relative h-screen flex flex-col overflow-hidden">
  <div className="flex-1 overflow-y-auto">
    <Routes>
      {routes.map(
        ({ layout, pages }) =>
          layout === "auth" &&
          pages.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </div>

  {/* <footer className="flex justify-center bottom-0 w-full text-blue-gray-600">
    <Footer />
  </footer> */}
</div>

  );
}

Auth.displayName = "/src/layout/Auth.jsx";

export default Auth;
