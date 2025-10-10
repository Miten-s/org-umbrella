import mongoose from "mongoose";

const GxpServiceAppAttachment = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "Application",
      required: true
    },
    attachmentLink: {
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

const GxpServiceAppServiceModel = mongoose.model(
  "GxpServiceAppAttachment",
  GxpServiceAppAttachment
);

GxpServiceAppAttachment.index({ appId: 1, service: 1 }, { unique: true });

export default GxpServiceAppServiceModel;
