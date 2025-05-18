import { lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import { PageUrl } from "@/types/utils.types";
import Login from "@/components/sign-in/Login";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const RolesAndPermissions = lazy(
  () => import("../pages/AccessManagement/RolesAndPermissions")
);
const Admins = lazy(() => import("@/pages/AccessManagement/AllAdmins"));

const routes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: PageUrl.Dashboard.path,
        index: true,
        element: <Dashboard />
      },
      {
        path: "access-management",
        children: [
          {
            path: PageUrl.Roles.path,
            element: <RolesAndPermissions />
          },
          {
            path: PageUrl.Admins.path,
            element: <Admins />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <div>404</div>
  },
  {
    path: "sign-in",
    element: <Login />
  }
];

export default routes;
