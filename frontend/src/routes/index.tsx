import { lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import Login from "@/components/sign-in/Login";
import { PageUrl } from "@/types/utils.types";

// Dashboard & Access Management
const Dashboard = lazy(() => import("../pages/dashboard"));
const RolesAndPermissions = lazy(() => import("../pages/access-management/roles-and-permissions"));

// My Space
const ProfileInfo = lazy(() => import("../pages/my-space/profile-info"));

// System IT Admin
const SysUsers = lazy(() => import("../pages/system-it-admin/users"));
const SysDepartments = lazy(() => import("../pages/system-it-admin/departments"));
const SysDesignations = lazy(() => import("../pages/system-it-admin/designations"));
const SysLocations = lazy(() => import("../pages/system-it-admin/locations"));

// Company
const CompanyManagement = lazy(() => import("../pages/company-management"));

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
        path: PageUrl.AccessManagement.path,
        children: [
          {
            path: PageUrl.Roles.path.replace(`${PageUrl.AccessManagement.path}/`, ""),
            element: <RolesAndPermissions />
          }
        ]
      },

      // My Space
      {
        path: PageUrl.MySpace.path,
        children: [
          {
            path: PageUrl.ProfileInfo.path.replace(`${PageUrl.MySpace.path}/`, ""),
            element: <ProfileInfo />
          }
        ]
      },

      // System IT Admin
      {
        path: PageUrl.System.path,
        children: [
          {
            path: PageUrl.Users.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysUsers />
          },
          {
            path: PageUrl.Departments.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysDepartments />
          },
          {
            path: PageUrl.Designations.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysDesignations />
          },
          {
            path: PageUrl.LocationsGroups.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysLocations />
          }
        ]
      },

      // Company
      {
        path: PageUrl.CompanySettings.path,
        index: true,
        element: <CompanyManagement />
      }
    ]
  },

  // Auth
  {
    path: PageUrl.SignIn.path,
    element: <Login />
  },

  // Fallback
  {
    path: "*",
    element: <div>404 - Not Found</div>
  }
];

export default routes;
