import mongoose from "mongoose";

const GxpServiceRequestGroupSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      ref: "GxpServiceRequest",
      required: true
    },
    group: {
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

const GxpRequestGroupModel = mongoose.model(
  "GxpServiceRequestGroup",
  GxpServiceRequestGroupSchema
);

export default GxpRequestGroupModel;
