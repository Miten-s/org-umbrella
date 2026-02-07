import mongoose from "mongoose";

const GxpServiceAppRoleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: "gxp-service-app-roles"
  }
);

const GxpServiceAppRoleModel = mongoose.model(
  "GxpServiceAppRoles",
  GxpServiceAppRoleSchema
);

GxpServiceAppRoleSchema.index({ role: 1 }, { unique: true });

export default GxpServiceAppRoleModel;
