import mongoose from "mongoose";

const GxpServiceRequestRoleSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      ref: "GxpServiceRequest",
      required: true
    },
    role: {
      type: String,
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
    timestamps: true,
    collection: "gxp-service-request-roles"
  }
);

const GxpRequestRoleModel = mongoose.model(
  "GxpServiceRequestRole",
  GxpServiceRequestRoleSchema
);

export default GxpRequestRoleModel;
