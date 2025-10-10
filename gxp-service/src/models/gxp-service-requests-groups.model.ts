import mongoose from "mongoose";

const GxpServiceRequestGroup = new mongoose.Schema(
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

const GxpRequesGroup = mongoose.model(
  "GxpServiceRequestGroup",
  GxpServiceRequestGroup
);

export default GxpRequesGroup;
