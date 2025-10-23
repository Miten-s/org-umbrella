import mongoose from "mongoose";

const GxpServiceAppRolesSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    role: {
      type: String,
      enum: ["User", "Resolver"],
      required: true
    },
    active: {
      type: Boolean,
      required: true
    },
    createdBy: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const GxpServiceRolesModel = mongoose.model(
  "GxpServiceAppRoles",
  GxpServiceAppRolesSchema
);

GxpServiceAppRolesSchema.index(
  { appId: 1, departmentName: 1 },
  { unique: true }
);

export default GxpServiceRolesModel;
