import mongoose from "mongoose";

const GxpServiceAppAttachmentSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
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
    timestamps: true,
    collection: "gxp-service-app-attachments"
  }
);

const GxpServiceAppAttachmentModel = mongoose.model(
  "GxpServiceAppAttachment",
  GxpServiceAppAttachmentSchema
);

GxpServiceAppAttachmentSchema.index({ appId: 1 }, { unique: true });

export default GxpServiceAppAttachmentModel;
