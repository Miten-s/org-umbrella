import mongoose from "mongoose";

const GxpServiceRequestRole = new mongoose.Schema(
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
    timestamps: true
  }
);

const GxpRequestRole = mongoose.model(
  "GxpServiceRequestRole",
  GxpServiceRequestRole
);

export default GxpRequestRole;
