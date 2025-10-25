import mongoose, { Schema } from "mongoose";

const generateSrvId = () => {
  const objectId = new mongoose.Types.ObjectId();
  return `SR_${objectId.toHexString()}`;
};

export interface IServiceRequest {
  _id: string;
  group: string;
  priority: "Very High" | "High" | "Medium" | "Low";
  applicationId: string;
  environment: string;
  note: string;
  module: string;
  requestRole: string;
  esignCheck: "Yes" | "No";
  trainingDone: boolean;
  description: string;
  shortDescription: string;
  attachments: string[];
  closedOn: Date;
  closedBy: string;
  createdBy: string;
  status:
    | "New"
    | "In Progress"
    | "Hold"
    | "Closed - Incomplete"
    | "Closed - Complete"
    | "Closed - Skipped";
  workflow: string;
  requestType: string;
  comments: string[];
}

const GxpServicePortalRequestSchema = new Schema<IServiceRequest>(
  {
    _id: {
      type: String,
      default: generateSrvId
    },
    group: { type: String, ref: "AssignmentGroup", required: true },
    priority: {
      type: String,
      enum: ["Very High", "High", "Medium", "Low"],
      required: true
    },
    applicationId: { type: String, ref: "GxpApplication", required: true },
    environment: { type: String, ref: "GxpEnvironment", required: true },
    module: {
      type: String,
      ref: "GxpServiceAppModule",
      required: true
    },
    note: { type: String },
    requestRole: { type: String },
    esignCheck: { type: String, enum: ["Yes", "No"], required: true },
    trainingDone: { type: Boolean, required: true, default: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    attachments: [{ type: String, ref: "GxpServiceAttachment" }],
    closedOn: { type: Date, default: null },
    closedBy: { type: String, maxlength: 40, default: "" },
    createdBy: { type: String, maxlength: 40, default: "" },
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
    workflow: { type: String, ref: "GxpServiceWorkflow" },
    requestType: { type: String, default: "Applications" },
    comments: [{ type: String }]
  },
  { timestamps: true, _id: false, collection: "gxp-service-service-requests" }
);

export const GxpServiceRequestModel = mongoose.model<IServiceRequest>(
  "GxpServiceRequest",
  GxpServicePortalRequestSchema
);
