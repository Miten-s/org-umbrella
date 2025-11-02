export type Permission = {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export type OptionalTranslations = {
  [K in SupportedLanguages]?: string;
};

// frontend enum must be in this order because of component to set
// default languages in admin panel
export enum SupportedLanguages {
  'en' = 'en',
  'ar' = 'ar',
  'de' = 'de',
  'es' = 'es',
  'fr' = 'fr',
  'he' = 'he',
  'it' = 'it',
  'hi' = 'hi',   
  'gu' = 'gu',   
  'ta' = 'ta',   
  'te' = 'te',   
  'mr' = 'mr',   
}

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
}

export interface AssignmentGroup {
  _id: string;
  groupName: string;
  manager: { userId: string; name: string };
  members: { userId: string; name: string }[];
  description?: string;
}

export interface User {
  _id: string;
  fullName: string;
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
