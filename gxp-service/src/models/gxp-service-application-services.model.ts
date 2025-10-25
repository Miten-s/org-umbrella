import mongoose from "mongoose";

const GxpServiceAppService = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    service: {
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
    collection: "gxp-service-app-services"
  }
);

const GxpServiceAppServiceModel = mongoose.model(
  "GxpServiceAppService",
  GxpServiceAppService
);

GxpServiceAppService.index({ appId: 1, service: 1 }, { unique: true });

export default GxpServiceAppServiceModel;
