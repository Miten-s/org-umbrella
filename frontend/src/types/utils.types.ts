export type PageUrlConfig = {
  path: string;
  matchPattern: RegExp;
  pageTitle?: string;
};

export type PageUrlType = {
  [key: string]: PageUrlConfig;
};

export const PageUrl: PageUrlType = {
  // #region Auth
  SignIn: {
    path: "/sign-in",
    matchPattern: /^\/sign-in$/i,
    pageTitle: "Sign In"
  },
  // #endregion

  // #region Dashboard
  Dashboard: {
    path: "/dashboard",
    matchPattern: /^\/dashboard$/i,
    pageTitle: "Dashboard"
  },
  // #endregion

  // #region Access Management
  AccessManagement: {
    path: "/access-management",
    matchPattern: /^\/access-management$/i,
    pageTitle: "Access Management"
  },
  Roles: {
    path: "/access-management/roles",
    matchPattern: /^\/access-management\/roles$/i,
    pageTitle: "Roles & Permissions"
  },
  Admins: {
    path: "/access-management/admins",
    matchPattern: /^\/access-management\/admins$/i,
    pageTitle: "All Admins"
  },
  // #endregion

  // #region Client
  Client: {
    path: "/client",
    matchPattern: /^\/client$/i,
    pageTitle: "Client"
  },

  // #region Client → My Space
  MySpace: {
    path: "/client/my-space",
    matchPattern: /^\/client\/my-space$/i,
    pageTitle: "My Space"
  },
  ProfileInfo: {
    path: "/client/my-space/profile-info",
    matchPattern: /^\/client\/my-space\/profile-info$/i,
    pageTitle: "Profile Info"
  },
  // #endregion

  // #region Client → System
  System: {
    path: "/client/system",
    matchPattern: /^\/client\/system$/i,
    pageTitle: "System"
  },
  SystemSettings: {
    path: "/client/system/settings",
    matchPattern: /^\/client\/system\/settings$/i,
    pageTitle: "System Settings"
  },
  Users: {
    path: "/client/system/users",
    matchPattern: /^\/client\/system\/users$/i,
    pageTitle: "Users"
  },
  Departments: {
    path: "/client/system/departments",
    matchPattern: /^\/client\/system\/departments$/i,
    pageTitle: "Departments"
  },
  Designations: {
    path: "/client/system/designations",
    matchPattern: /^\/client\/system\/designations$/i,
    pageTitle: "Designations"
  },
  LocationsGroups: {
    path: "/client/system/locations",
    matchPattern: /^\/client\/system\/locations$/i,
    pageTitle: "Locations"
  },
  // #endregion

  // #region Client → Company
  Company: {
    path: "/client/company",
    matchPattern: /^\/client\/company$/i,
    pageTitle: "Company"
  },
  CompanySettings: {
    path: "/client/company/settings",
    matchPattern: /^\/client\/company\/settings$/i,
    pageTitle: "Company Settings"
  }
  // #endregion
};

