export type PageUrlConfig = {
  path: string;
  matchPattern: RegExp;
  pageTitle?: string;
};

export type PageUrlType = {
  [key: string]: PageUrlConfig;
};

export const PageUrl: PageUrlType = {
  // #region Dashboard & Access Management
  Dashboard: {
    path: "/dashboard",
    matchPattern: /^\/dashboard$/i,
    pageTitle: "Dashboard"
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

  // #region Auth
  SignIn: {
    path: "/sign-in",
    matchPattern: /^\/sign-in$/i,
    pageTitle: "Sign In"
  },
  // #endregion

  // #region My Space (Client Scoped)
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

  // #region System IT Administration (Client Scoped)
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
  }
  // #endregion
};

