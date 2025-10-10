import mongoose from "mongoose";

const GxpServiceRequestAttachment = new mongoose.Schema(
  {
    requestId: {
      type: String,
      ref: "GxpServiceRequest",
      required: true
    },
    attachment: {
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

const GxpRequestAttachment = mongoose.model(
  "GxpServiceRequestAttachment",
  GxpServiceRequestAttachment
);

export default GxpRequestAttachment;
