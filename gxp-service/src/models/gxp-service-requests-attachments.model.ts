import mongoose from "mongoose";

const GxpServiceRequestAttachmentSchema = new mongoose.Schema(
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

const GxpRequestAttachmentModel = mongoose.model(
  "GxpServiceRequestAttachment",
  GxpServiceRequestAttachmentSchema
);

export default GxpRequestAttachmentModel;
