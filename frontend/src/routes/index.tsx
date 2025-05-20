import { lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import { PageUrl } from "@/types/utils.types";
import Login from "@/components/sign-in/Login";

// Dashboard & Access Management
const Dashboard = lazy(() => import("../pages/dashboard"));
const RolesAndPermissions = lazy(() => import("../pages/access-management/roles-and-permissions"));
const Admins = lazy(() => import("../pages/access-management/all-admins"));

// My Space
const ProfileInfo = lazy(() => import("../pages/my-space/profile-info"));

// System IT Admin
const SysUsers = lazy(() => import("../pages/system-it-admin/users"));
const SysDepartments = lazy(() => import("../pages/system-it-admin/departments"));
const SysDesignations = lazy(() => import("../pages/system-it-admin/designations"));
const SysLocations = lazy(() => import("../pages/system-it-admin/locations"));

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
      },
      // START REGION: System IT Administration
      {
        path: "client/system",
        children: [
          { path: "users", element: <SysUsers /> },
          { path: "departments", element: <SysDepartments /> },
          { path: "designations", element: <SysDesignations /> },
          { path: "locations", element: <SysLocations /> }
        ]
      },
      // END REGION: System IT Administration
      
       // START REGION: My Space
      {
        path: "client/my-space",
        children: [
          { path: "profile-info", element: <ProfileInfo /> },
        ]
      },
      // END REGION: My Space
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
