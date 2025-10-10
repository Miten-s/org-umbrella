import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  applicationName: string;
  applicationType: "GxP" | "Non-GxP";
  applicationEnvironment?: string;
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

const ApplicationSchema = new Schema<IApplication>(
  {
    applicationName: { type: String, required: true, trim: true },
    applicationType: { type: String, enum: ["GxP", "Non-GxP"], required: true },
    applicationEnvironment: { type: String, trim: true },
    applicationRoles: { type: [String], default: [] },
    applicationGroups: { type: [String], default: [] },
    // Move the services to the app_services
    applicationServiceRequestTypes: {
      type: [String],
      default: [],
      enum: [
        "Provide Access",
        "Modify Access",
        "Remove Access",
        "Generate Report",
        "Add Master Data Request",
        "Edit Master Data Request",
        "Remove Master Data Request",
        "Other Request"
      ]
    },
    applicationModules: { type: [String], default: [] },
    applicationWorkflow: { type: String, trim: true },
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

export const ApplicationModel = mongoose.model<IApplication>(
  "GxpApplication",
  ApplicationSchema
);
