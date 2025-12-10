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
  departments: string[];
  notes?: string;
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
      ref: "GxpServiceEnvironment"
    },
    group: { type: String, ref: "GxpServiceAssignmentGroup" },
    applicationRoles: {
      type: [{ type: String, ref: "GxpServiceAppRoles" }],
      default: []
    },
    applicationGroups: { type: [{ type: String, ref: "GxpServiceAppGroup" }] },
    applicationServiceRequestTypes: {
      type: [{ type: String, ref: "GxpServiceAppService" }],
      default: []
    },
    applicationModules: {
      type: [{ type: String, ref: "GxpServiceAppModule" }],
      default: []
    },
    applicationWorkflow: {
      type: String,
      ref: "GxpServiceWorkflow"
    },
    applicationSystemOwner: { type: String, ref: "GxpServiceUser" },
    applicationProcessOwner: {
      type: String,
      ref: "GxpServiceUser"
    },
    supplier: { type: String, ref: "GxpServiceSupplier" },
    departments: {
      type: [{ type: String, ref: "GxpServiceAppDepartments" }],
      default: []
    },
    notes: { type: String, trim: true },
    attachments: [{ type: String, ref: "GxpServiceAppAttachment" }],
    createdOn: { type: Date, default: null },
    createdBy: { type: String, default: null },
    modifiedOn: { type: Date, default: null },
    modifiedBy: { type: String, default: null },
    status: { type: String, enum: ["enabled", "disabled"], default: "enabled" }
  },
  {
    timestamps: false,
    collection: "gxp-service-applications"
  }
);

GxpServiceApplicationSchema.index({ applicationName: 1 }, { unique: true });

const GxpServiceApplicationModel = mongoose.model<IApplication>(
  "GxpServiceApplication",
  GxpServiceApplicationSchema
);

export default GxpServiceApplicationModel;
