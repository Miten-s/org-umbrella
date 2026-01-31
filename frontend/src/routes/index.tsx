import { lazy } from "react";
import AppLayout from "../components/layout/AppLayout";
import Login from "@/components/sign-in/Login";
import { PageUrl } from "@/types/utils.types";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";
import type { AppRoute } from "./types";

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

// GXP Service
const GXPUsersPage = lazy(() => import("../pages/gxp-service/users"));
const GXPRolesAndPermissionsPage = lazy(() => import("../pages/gxp-service/roles-and-permissions"));
const GXPWorkflowsPage = lazy(() => import("../pages/gxp-service/workflows"));
const GXPAssignmentGroupsPage = lazy(() => import("../pages/gxp-service/assignment-groups"));
const GXPEnvironmentsPage = lazy(() => import("../pages/gxp-service/environments"));
const GXPSuppliersPage = lazy(() => import("../pages/gxp-service/suppliers"));
const GXPApplicationSoftwareModulePage = lazy(() => import("../pages/gxp-service/application-software-module"));
const GXPAddNewApplicationPage = lazy(() => import("../pages/gxp-service/add-new-application"));
const GXPCreateNewServiceRequestPage = lazy(() => import("../pages/gxp-service/create-new-service-request"));

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
          requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
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
              requiredPermission: ADMIN_PERMISSIONS.VIEW_ROLE
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
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Profile Info",
              icon: "profile"
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
              requiredPermission: ADMIN_PERMISSIONS.VIEW_USER
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
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DEPARTMENT
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
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DESIGNATION
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
              requiredPermission: ADMIN_PERMISSIONS.VIEW_LOCATION
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
          requiredPermission: ADMIN_PERMISSIONS.OPERATE_ALL
        },
        meta: {
          title: "Company Settings",
          icon: "company"
        }
      },

      // GXP Service
      {
        path: PageUrl.GXPService.path,
        children: [
          {
            path: PageUrl.GXPUsers.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPUsersPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Users",
              icon: "users"
            }
          },
          {
            path: PageUrl.GXPRolesAndPermissions.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPRolesAndPermissionsPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Roles and Permissions",
              icon: "roles"
            }
          },
          {
            path: PageUrl.GXPWorkflows.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPWorkflowsPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Workflows",
              icon: "workflows"
            }
          },
          {
            path: PageUrl.GXPAssignmentGroups.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPAssignmentGroupsPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Assignment Groups",
              icon: "assignment-groups"
            }
          },
          {
            path: PageUrl.GXPEnvironments.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPEnvironmentsPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Environments",
              icon: "environments"
            }
          },
          {
            path: PageUrl.GXPSuppliers.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPSuppliersPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Suppliers",
              icon: "suppliers"
            }
          },
          {
            path: PageUrl.GXPApplicationSoftwareModule.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPApplicationSoftwareModulePage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Application/Software Module",
              icon: "application-software-module"
            }
          },
          {
            path: PageUrl.GXPAddNewApplication.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPAddNewApplicationPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Add a new GxP Portal Application/Software form",
              icon: "add-new-application"
            }
          },
          {
            path: PageUrl.GXPCreateNewServiceRequest.path.replace(`${PageUrl.GXPService.path}/`, ""),
            element: <GXPCreateNewServiceRequestPage />,
            protection: {
              requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD
            },
            meta: {
              title: "Create a new Service Request",
              icon: "create-new-service-request"
            }
          }
        ]
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
