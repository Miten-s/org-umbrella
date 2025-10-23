import mongoose, { Schema } from "mongoose";
import { STATUS } from "../types/common.types";

export interface Workflow {
  _id: string;
  workflowName: string;
  numberOfLevels: number;
  groups: string[];
  description: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
  status: STATUS;
}

const GxpServiceWorkflowSchema = new Schema(
  {
    workflowName: { type: String, required: true, maxlength: 20 },
    numberOfLevels: { type: Number, required: true },
    levels: { type: [String], required: true },
    description: { type: String, maxlength: 50 },
    createdOn: { type: Date, default: null },
    createdBy: { type: String, required: true },
    modifiedOn: { type: Date, default: null },
    modifiedBy: { type: String, maxlength: 40, default: null },
    status: { type: String, enum: STATUS, default: true }
  },
  { timestamps: false }
);

export const GxpServiceWorkFlowModel = mongoose.model<Workflow>(
  "GxpServiceWorkflow",
  GxpServiceWorkflowSchema
);
