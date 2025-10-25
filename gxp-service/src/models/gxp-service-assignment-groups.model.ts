import mongoose, { Schema } from "mongoose";

export interface AssignmentGroup {
  groupName: string;
  manager: {
    userId: string;
    name: string;
  };
  members: {
    userId: string;
    name: string;
  }[];
  description: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
  isActive: boolean;
}

const GxpServiceAssignmentGroupSchema = new Schema(
  {
    groupName: {
      type: String,
      required: true,
      match: /^[A-Z]{2}-[A-Z]{3,}-[A-Z]{2,}-[A-Z]{2,}$/, // Format like RD-APP-LIMS-BUS-ADMIN
      unique: true,
      index: true
    },
    manager: {
      userId: { type: String, required: true },
      name: { type: String, required: true }
    },
    members: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true }
      }
    ],
    description: { type: String, maxlength: 50 },
    createdOn: { type: Date, default: null },
    createdBy: { type: String, maxlength: 40, default: "" },
    modifiedOn: { type: Date, default: null },
    modifiedBy: { type: String, maxlength: 40, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: false, collection: "gxp-service-assignment-groups" }
);

const GxpServiceAssignmentGroupModel = mongoose.model<AssignmentGroup>(
  "GxpServiceAssignmentGroup",
  GxpServiceAssignmentGroupSchema
);

export default GxpServiceAssignmentGroupModel;
