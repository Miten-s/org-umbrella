import mongoose, { Schema } from "mongoose";
import { STATUS } from "../types/common.types";

export interface Workflow {
  workflowId: string;
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

const workflowSchema = new Schema(
  {
    workflowId: { type: String, required: true, unique: true, index: true },
    workflowName: { type: String, required: true, maxlength: 20 },
    numberOfLevels: { type: Number, required: true },
    groups: { type: [String], required: true },
    description: { type: String, maxlength: 50 },
    createdOn: { type: Date, default: null },
    createdBy: { type: String, maxlength: 40, default: "" },
    modifiedOn: { type: Date, default: null },
    modifiedBy: { type: String, maxlength: 40, default: "" },
    status: { type: String, enum: STATUS, default: true }
  },
  { timestamps: false }
);

export const WorkflowModel = mongoose.model<Workflow>(
  "Workflow",
  workflowSchema
);
