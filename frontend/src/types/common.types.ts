export type Permission = {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
};

export type UserRolePermission = {
  _id?: string;
  name: string;
};

export type UserRole = {
  _id?: string;
  name: string;
  permissions?: UserRolePermission[];
};

export type UserEntityReference = {
  _id?: string;
  departmentName?: string;
  designationName?: string;
  locationName?: string;
  name?: string;
  [key: string]: unknown;
};

export type AuthenticatedUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  status?: string;
  userType?: string;
  lastLogin?: string | number | Date;
  createdAt?: string | number | Date;
  currentLanguage?: SupportedLanguages | string;
  department?: UserEntityReference;
  designation?: UserEntityReference;
  location?: UserEntityReference;
  modifiable?: boolean;
  trainingCompleted?: boolean;
  roles?: UserRole[];
  [key: string]: unknown;
};

export type CurrentCompany = {
  _id?: string;
  name?: string;
  description?: string;
  logo?: string;
  [key: string]: unknown;
};

export type OptionalTranslations = {
  [K in SupportedLanguages]?: string;
};

// frontend enum must be in this order because of component to set
// default languages in admin panel
export enum SupportedLanguages {
  "en" = "en",
  "ar" = "ar",
  "de" = "de",
  "es" = "es",
  "fr" = "fr",
  "he" = "he",
  "it" = "it",
  "hi" = "hi",
  "gu" = "gu",
  "ta" = "ta",
  "te" = "te",
  "mr" = "mr"
}

export const applicationTypeOptions = [
  { label: "GxP", value: "GxP" },
  { label: "Non-GxP", value: "Non-GxP" }
];

export enum ApplicationRole {
  User = "User",
  Resolver = "Resolver"
}

export const applicationRoleOptions = Object.values(ApplicationRole).map(
  (label) => ({
    label,
    value: label
  })
);

export enum ApplicationServiceRequestType {
  ProvideAccess = "Provide Access",
  ModifyAccess = "Modify Access",
  RemoveAccess = "Remove Access",
  GenerateReport = "Generate Report",
  AddMasterDataRequest = "Add Master Data Request",
  EditMasterDataRequest = "Edit Master Data Request",
  RemoveMasterDataRequest = "Remove Master Data Request",
  OtherRequest = "Other Request"
}

export const applicationServiceRequestTypeOptions = Object.values(
  ApplicationServiceRequestType
).map((label) => ({ label, value: label }));

export interface Designation {
  _id: string;
  designationName: string;
  description?: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  _id: string;
  locationName: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Department {
  _id: string;
  departmentId: string;
  departmentName: string;
  locationId?: string;
  departmentManagerId?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Company {
  _id: string;
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

export interface Supplier {
  _id: string;
  supplierName: string;
  typeOfSupplier?: string;
  product?: string;
  description?: string;
  status: "enabled" | "disabled";
}

export interface Workflow {
  _id: string;
  workflowName: string;
  numberOfLevels: number;
  levels: string[];
  description?: string;
  status: "enabled" | "disabled";
  assignmentGroupId?: string;
}

export interface AssignmentGroup {
  _id: string;
  groupName: string;
  manager: { userId: string; name: string };
  members: { userId: string; name: string }[];
  description?: string;
  isActive: boolean;
}

export interface User {
  _id: string;
  fullName: string;
  userType: string;
}

export interface Environment {
  _id: string;
  environmentName: string;
  description?: string;
}

export interface GxpPermission {
  _id: string;
  permissionName: string;
  description?: string;
}

export interface GxpRole {
  _id: string;
  roleName: string;
  permissions: string[];
  description?: string;
}
