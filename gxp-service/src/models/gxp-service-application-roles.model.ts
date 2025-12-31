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
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: "gxp-service-app-roles"
  }
);

const GxpServiceRolesModel = mongoose.model(
  "GxpServiceAppRoles",
  GxpServiceAppRolesSchema
);

GxpServiceAppRolesSchema.index({ appId: 1, role: 1 }, { unique: true });

export default GxpServiceRolesModel;
