import mongoose from "mongoose";

const GxpServiceAppService = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "Application",
      required: true
    },
    service: {
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
  "GxpServiceAppService",
  GxpServiceAppService
);

GxpServiceAppService.index({ appId: 1, service: 1 }, { unique: true });

export default GxpServiceAppServiceModel;
