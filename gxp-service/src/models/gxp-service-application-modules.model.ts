import mongoose from "mongoose";

const GxpServiceAppModuleSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    moduleName: {
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
    collection: "gxp-service-app-modules"
  }
);

const GxpServiceAppModuleModel = mongoose.model(
  "GxpServiceAppModule",
  GxpServiceAppModuleSchema
);

GxpServiceAppModuleSchema.index({ appId: 1, moduleName: 1 });

export default GxpServiceAppModuleModel;
