import mongoose, { Schema } from "mongoose";

const generateSrvId = () => {
  const objectId = new mongoose.Types.ObjectId();
  return `SR_${objectId.toHexString()}`;
};

export interface IServiceRequest {
  _id?: string;
  priority: "Very High" | "High" | "Medium" | "Low";
  application: string;
  esignCheck: "Yes" | "No";
  trainingDone: boolean;
  description: string;
  shortDescription: string;
  closedOn: Date;
  closedBy: string;
  createdBy: string;
  assignmentGroup: string;
  status:
    | "New"
    | "In Progress"
    | "Hold"
    | "Closed - Incomplete"
    | "Closed - Complete"
    | "Closed - Skipped";
  requestType: string;
  comments: string[];
  location?: string;
  environment?: string;
  workflow?: string;
  modules?: string[];
  roles?: string[];
  notes?: string;
  attachments?: string[];
}

const GxpServicePortalRequestSchema = new Schema<IServiceRequest>(
  {
    _id: {
      type: String,
      default: generateSrvId
    },
    priority: {
      type: String,
      enum: ["Very High", "High", "Medium", "Low"],
      required: true
    },
    application: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    assignmentGroup: {
      type: String,
      ref: "GxpServiceAssignmentGroup",
      default: null
    },
    location: {
      type: String,
    },
    environment: {
      type: String,
      ref: "GxpServiceEnvironment"
    },
    workflow: {
      type: String,
      ref: "GxpServiceWorkflow"
    },
    modules: {
      type: [{ type: String, ref: "GxpServiceAppModule" }],
      default: []
    },
    roles: {
      type: [{ type: String, ref: "GxpServiceAppRoles" }], // Assuming generic string ref or specific model if found later
      default: []
    },
    notes: [{ type: String }],
    attachments: [{ type: String, ref: "GxpServiceRequestAttachment" }],
    esignCheck: { type: String, enum: ["Yes", "No"], default: "No" },
    trainingDone: { type: Boolean, required: true, default: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    closedOn: { type: Date, default: null },
    closedBy: { type: String, maxlength: 40, default: null },
    createdBy: { type: String, maxlength: 40, default: null },
    status: {
      type: String,
      enum: [
        "New",
        "In Progress",
        "Hold",
        "Closed - Incomplete",
        "Closed - Complete",
        "Closed - Skipped"
      ],
      default: "New"
    },
    requestType: { type: String, default: "Applications" },
    comments: [{ type: String }]
  },
  { timestamps: true, _id: false, collection: "gxp-service-service-requests" }
);

export const GxpServiceRequestModel = mongoose.model<IServiceRequest>(
  "GxpServiceRequest",
  GxpServicePortalRequestSchema
);
