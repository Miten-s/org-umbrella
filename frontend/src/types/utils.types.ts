export type PageUrlConfig = {
  path: string;
  matchPattern: RegExp;
  pageTitle?: string;
};

export type PageUrlType = {
  [key: string]: PageUrlConfig;
};

export const PageUrl: PageUrlType = {
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
  SignIn: {
    path: "/sign-in",
    matchPattern: /^\/sign-in$/i,
    pageTitle: "Sign In"
  }
};
