import mongoose, { Schema } from "mongoose";

export interface IGxpServicePortalPermissions {
  permissionName: string;
  description: string;
  createdBy: string;
  modifiedBy: string;
}

const GxpServicePortalPermissionsSchema = new Schema(
  {
    permissionName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: 50
    },
    createdBy: {
      type: String,
      maxlength: 40
    },
    modifiedBy: {
      type: String,
      maxlength: 40
    }
  },
  {
    timestamps: true,
    collection: "gxp-service-permissions"
  }
);

const GxpServicePortalPermissionsModel = mongoose.model(
  "GxpServicePortalPermission",
  GxpServicePortalPermissionsSchema
);

export default GxpServicePortalPermissionsModel;
