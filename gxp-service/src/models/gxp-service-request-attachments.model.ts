
import mongoose from "mongoose";

const GxpServiceRequestAttachmentSchema = new mongoose.Schema(
  {
    srvId: {
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
    collection: "gxp-service-request-attachments"
  }
);

const GxpServiceRequestAttachmentModel = mongoose.model(
  "GxpServiceRequestAttachment",
  GxpServiceRequestAttachmentSchema
);

GxpServiceRequestAttachmentSchema.index(
  { srvId: 1, attachment: 1 },
  { unique: true }
);

export default GxpServiceRequestAttachmentModel;
