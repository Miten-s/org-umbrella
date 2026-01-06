import mongoose from "mongoose";

const GxpServiceAppService = new mongoose.Schema(
  {
    service: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
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

GxpServiceAppService.index({ service: 1 }, { unique: true });

export default GxpServiceAppServiceModel;
