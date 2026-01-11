import mongoose, { Schema } from "mongoose";

const generateSrvId = () => {
  const objectId = new mongoose.Types.ObjectId();
  return `SR_${objectId.toHexString()}`;
};

export interface IServiceRequest {
  _id: string;
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
    esignCheck: { type: String, enum: ["Yes", "No"], default: "No" },
    trainingDone: { type: Boolean, required: true, default: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
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
    requestType: { type: String, default: "Applications" },
    comments: [{ type: String }]
  },
  { timestamps: true, _id: false, collection: "gxp-service-service-requests" }
);

export const GxpServiceRequestModel = mongoose.model<IServiceRequest>(
  "GxpServiceRequest",
  GxpServicePortalRequestSchema
);
