import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  applicationName: string;
  applicationType: "GxP" | "Non-GxP";
  applicationEnvironment?: string;
  group: string;
  applicationRoles: string[];
  applicationGroups: string[];
  applicationServiceRequestTypes: string[];
  applicationModules: string[];
  applicationWorkflow?: string;
  applicationSystemOwner?: string;
  applicationProcessOwner?: string;
  supplier?: string;
  departments: string;
  note?: string;
  attachments: string[];
  createdOn?: Date | null;
  createdBy?: string | null;
  modifiedOn?: Date | null;
  modifiedBy?: string | null;
  status: "enabled" | "disabled";
}

const GxpServiceApplicationSchema = new Schema<IApplication>(
  {
    applicationName: { type: String, required: true, trim: true },
    applicationType: { type: String, enum: ["GxP", "Non-GxP"], required: true },
    applicationEnvironment: {
      type: String,
      ref: "GxpEnvironment",
      trim: true
    },
    group: { type: String, trim: true }, // This will be basically a Object Id
    applicationRoles: {
      type: [{ type: String, ref: "GxpServiceAppRole" }],
      default: []
    },
    applicationGroups: { type: [{ type: String, ref: "GxpServiceAppGroup" }] },
    // Move the services to the app_services
    applicationServiceRequestTypes: {
      type: [{ type: String, ref: "GxpServiceAppService" }],
      default: []
      // enum: [
      //   "Provide Access",
      //   "Modify Access",
      //   "Remove Access",
      //   "Generate Report",
      //   "Add Master Data Request",
      //   "Edit Master Data Request",
      //   "Remove Master Data Request",
      //   "Other Request"
      // ]
    },
    applicationModules: {
      type: [{ type: String, ref: "GxpServiceAppModule" }],
      default: []
    },
    applicationWorkflow: {
      type: String,
      ref: "GxpServiceAppWorkflow",
      trim: true
    },
    applicationSystemOwner: { type: String, ref: "GxpServiceUser", trim: true },
    applicationProcessOwner: {
      type: String,
      ref: "GxpServiceUser",
      trim: true
    },
    supplier: { type: String, ref: "GxpSupplier", trim: true },
    departments: { type: String, ref: "GxpServiceAppDepartment" },
    note: { type: String, trim: true },
    attachments: [{ type: String, ref: "GxpServiceAppAttachment", trim: true }],
    createdOn: { type: Date, default: null },
    createdBy: { type: String, default: null },
    modifiedOn: { type: Date, default: null },
    modifiedBy: { type: String, default: null },
    status: { type: String, enum: ["enabled", "disabled"], default: "enabled" }
  },
  {
    timestamps: false
  }
);

const GxpServiceApplicationModel = mongoose.model<IApplication>(
  "GxpServiceApplication",
  GxpServiceApplicationSchema
);

export default GxpServiceApplicationModel;
