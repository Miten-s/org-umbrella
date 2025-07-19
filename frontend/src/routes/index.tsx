import { lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import Login from "@/components/sign-in/Login";
import { PageUrl } from "@/types/utils.types";
import { PERMISSIONS } from "@/utils/permissions";
import type { AppRoute } from "./types";

// Dashboard & Access Management
const Dashboard = lazy(() => import("../pages/dashboard"));
const RolesAndPermissions = lazy(() => import("../pages/access-management/roles-and-permissions"));

// My Space
const ProfileInfo = lazy(() => import("../pages/my-space/profile-info"));
const AboutCompany = lazy(() => import("../pages/my-space/about-company"));

// System IT Admin
const SysUsers = lazy(() => import("../pages/system-it-admin/users"));
const SysDepartments = lazy(() => import("../pages/system-it-admin/departments"));
const SysDesignations = lazy(() => import("../pages/system-it-admin/designations"));
const SysLocations = lazy(() => import("../pages/system-it-admin/locations"));

// Company
const CompanyManagement = lazy(() => import("../pages/company-management"));

const routes: AppRoute[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: PageUrl.Dashboard.path,
        index: true,
        element: <Dashboard />,
        protection: {
          requiredPermission: PERMISSIONS.VIEW_DASHBOARD
        },
        meta: {
          title: "Dashboard",
          icon: "dashboard"
        }
      },
      {
        path: PageUrl.AccessManagement.path,
        children: [
          {
            path: PageUrl.Roles.path.replace(`${PageUrl.AccessManagement.path}/`, ""),
            element: <RolesAndPermissions />,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_ROLE
            },
            meta: {
              title: "Roles & Permissions",
              icon: "roles"
            }
          }
        ]
      },

      // My Space
      {
        path: PageUrl.MySpace.path,
        children: [
          {
            path: PageUrl.ProfileInfo.path.replace(`${PageUrl.MySpace.path}/`, ""),
            element: <ProfileInfo />,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Profile Info",
              icon: "profile"
            }
          }, {
            path: PageUrl.AboutCompany.path.replace(`${PageUrl.MySpace.path}/`, ""),
            element: <AboutCompany/>,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "About Company",
              icon: "About Company"
            }
          }
        ]
      },

      // System IT Admin
      {
        path: PageUrl.System.path,
        children: [
          {
            path: PageUrl.Users.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysUsers />,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_USER
            },
            meta: {
              title: "Users",
              icon: "users"
            }
          },
          {
            path: PageUrl.Departments.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysDepartments />,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_DEPARTMENT
            },
            meta: {
              title: "Departments",
              icon: "departments"
            }
          },
          {
            path: PageUrl.Designations.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysDesignations />,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_DESIGNATION
            },
            meta: {
              title: "Designations",
              icon: "designations"
            }
          },
          {
            path: PageUrl.LocationsGroups.path.replace(`${PageUrl.System.path}/`, ""),
            element: <SysLocations />,
            protection: {
              requiredPermission: PERMISSIONS.VIEW_LOCATION
            },
            meta: {
              title: "Locations",
              icon: "locations"
            }
          }
        ]
      },

      // Company
      {
        path: PageUrl.CompanySettings.path,
        element: <CompanyManagement />,
        protection: {
          requiredPermission: PERMISSIONS.OPERATE_ALL
        },
        meta: {
          title: "Company Settings",
          icon: "company"
        }
      }
    ]
  },

  // Auth - Public route
  {
    path: PageUrl.SignIn.path,
    element: <Login />,
    meta: {
      title: "Sign In",
      hideFromMenu: true
    }
  },

  // Fallback
  {
    path: "*",
    element: <div>404 - Not Found</div>,
    meta: {
      title: "Not Found",
      hideFromMenu: true
    }
  }
];

export default routes;
