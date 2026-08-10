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
  },
  // #endregion

  // #region GXP Service
  GXPService: {
    path: "/gxp-service",
    matchPattern: /^\/gxp-service$/i,
    pageTitle: "GXP Service"
  },
  GXPUsers: {
    path: "/gxp-service/users",
    matchPattern: /^\/gxp-service\/users$/i,
    pageTitle: "Users"
  },
  GXPRolesAndPermissions: {
    path: "/gxp-service/roles-and-permissions",
    matchPattern: /^\/gxp-service\/roles-and-permissions$/i,
    pageTitle: "Roles and Permissions"
  },
  GXPWorkflows: {
    path: "/gxp-service/workflows",
    matchPattern: /^\/gxp-service\/workflows$/i,
    pageTitle: "Workflows"
  },
  GXPAssignmentGroups: {
    path: "/gxp-service/assignment-groups",
    matchPattern: /^\/gxp-service\/assignment-groups$/i,
    pageTitle: "Assignment Groups"
  },
  GXPEnvironments: {
    path: "/gxp-service/environments",
    matchPattern: /^\/gxp-service\/environments$/i,
    pageTitle: "Environments"
  },
  GXPSuppliers: {
    path: "/gxp-service/suppliers",
    matchPattern: /^\/gxp-service\/suppliers$/i,
    pageTitle: "Suppliers"
  },
  GXPApplicationSoftwareModule: {
    path: "/gxp-service/application-software-module",
    matchPattern: /^\/gxp-service\/application-software-module$/i,
    pageTitle: "Application/Software Module"
  },
  GXPAddNewApplication: {
    path: "/gxp-service/add-new-application",
    matchPattern: /^\/gxp-service\/add-new-application$/i,
    pageTitle: "Add a new GxP Portal Application/Software form"
  },
  GXPCreateNewServiceRequest: {
    path: "/gxp-service/create-new-service-request",
    matchPattern: /^\/gxp-service\/create-new-service-request$/i,
    pageTitle: "Create a new Service Request"
  },
  // #endregion

  // #region LIMS
  LIMS: {
    path: "/lims",
    matchPattern: /^\/lims$/i,
    pageTitle: "LIMS"
  },

  // LIMS → Lab Access
  LIMSUsers: {
    path: "/lims/users",
    matchPattern: /^\/lims\/users$/i,
    pageTitle: "Lab Users"
  },
  LIMSRoles: {
    path: "/lims/roles",
    matchPattern: /^\/lims\/roles$/i,
    pageTitle: "Lab Roles"
  },
  LIMSGroups: {
    path: "/lims/groups",
    matchPattern: /^\/lims\/groups$/i,
    pageTitle: "Lab Groups"
  },

  // LIMS → Lab Setup
  LIMSProjects: {
    path: "/lims/projects",
    matchPattern: /^\/lims\/projects$/i,
    pageTitle: "Projects"
  },
  LIMSStudies: {
    path: "/lims/studies",
    matchPattern: /^\/lims\/studies$/i,
    pageTitle: "Studies"
  },
  LIMSSuppliers: {
    path: "/lims/suppliers",
    matchPattern: /^\/lims\/suppliers$/i,
    pageTitle: "Suppliers"
  },
  LIMSCustomers: {
    path: "/lims/customers",
    matchPattern: /^\/lims\/customers$/i,
    pageTitle: "Customers"
  },
  LIMSLocations: {
    path: "/lims/locations",
    matchPattern: /^\/lims\/locations$/i,
    pageTitle: "Storage Locations"
  },
  LIMSStocks: {
    path: "/lims/stocks",
    matchPattern: /^\/lims\/stocks$/i,
    pageTitle: "Stock Items"
  },
  LIMSParameters: {
    path: "/lims/parameters",
    matchPattern: /^\/lims\/parameters$/i,
    pageTitle: "Parameters"
  },
  LIMSStockBatches: {
    path: "/lims/stock-batches",
    matchPattern: /^\/lims\/stock-batches$/i,
    pageTitle: "Stock Batches"
  },
  LIMSAliquots: {
    path: "/lims/aliquots",
    matchPattern: /^\/lims\/aliquots$/i,
    pageTitle: "Aliquots"
  },
  LIMSInstruments: {
    path: "/lims/instruments",
    matchPattern: /^\/lims\/instruments$/i,
    pageTitle: "Instruments"
  },
  LIMSInstrumentParts: {
    path: "/lims/instrument-parts",
    matchPattern: /^\/lims\/instrument-parts$/i,
    pageTitle: "Instrument Parts"
  },
  LIMSCalibrations: {
    path: "/lims/calibrations",
    matchPattern: /^\/lims\/calibrations$/i,
    pageTitle: "Calibrations"
  },
  LIMSInspectionPlans: {
    path: "/lims/inspection-plans",
    matchPattern: /^\/lims\/inspection-plans$/i,
    pageTitle: "Inspection Plans"
  },
  LIMSAnalyses: {
    path: "/lims/analyses",
    matchPattern: /^\/lims\/analyses$/i,
    pageTitle: "Analyses"
  },
  LIMSTestGroups: {
    path: "/lims/test-groups",
    matchPattern: /^\/lims\/test-groups$/i,
    pageTitle: "Test Groups"
  },
  LIMSSpecifications: {
    path: "/lims/specifications",
    matchPattern: /^\/lims\/specifications$/i,
    pageTitle: "Specifications"
  },
  LIMSBatches: {
    path: "/lims/batches",
    matchPattern: /^\/lims\/batches$/i,
    pageTitle: "Batches"
  },
  LIMSLots: {
    path: "/lims/lots",
    matchPattern: /^\/lims\/lots$/i,
    pageTitle: "Lots"
  },
  LIMSSamples: {
    path: "/lims/samples",
    matchPattern: /^\/lims\/samples$/i,
    pageTitle: "Samples"
  },
  LIMSTests: {
    path: "/lims/tests",
    matchPattern: /^\/lims\/tests$/i,
    pageTitle: "Tests"
  },
  LIMSResults: {
    path: "/lims/results",
    matchPattern: /^\/lims\/results$/i,
    pageTitle: "Results"
  },
  LIMSSchedulers: {
    path: "/lims/schedulers",
    matchPattern: /^\/lims\/schedulers$/i,
    pageTitle: "Schedulers"
  },
  LIMSPhrases: {
    path: "/lims/phrases",
    matchPattern: /^\/lims\/phrases$/i,
    pageTitle: "Pick Lists"
  }
  // #endregion
};
