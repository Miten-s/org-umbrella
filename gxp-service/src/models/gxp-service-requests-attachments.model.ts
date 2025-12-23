import mongoose from "mongoose";

export interface IGxpServiceRequestAttachment {
  requestId: string;
  attachment: string;
  active: boolean;
  createdBy: string;
}

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
    timestamps: true,
    collection: "gxp-service-requests-attachments"
  }
);

const GxpRequestAttachmentModel = mongoose.model(
  "GxpServiceRequestAttachment",
  GxpServiceRequestAttachmentSchema
);

export default GxpRequestAttachmentModel;
