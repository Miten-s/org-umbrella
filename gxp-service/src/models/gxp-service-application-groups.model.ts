import mongoose from "mongoose";

const GxpServiceAppGroupSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    appGroup: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: "gxp-service-app-groups"
  }
);

const GxpServiceAppGroupModel = mongoose.model(
  "GxpServiceAppGroup",
  GxpServiceAppGroupSchema
);

GxpServiceAppGroupSchema.index({ appId: 1, appGroup: 1 }, { unique: true });

export default GxpServiceAppGroupModel;
