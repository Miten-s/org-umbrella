import mongoose from "mongoose";

enum STATUS {
  ENABLED = "enabled",
  DISABLED = "disabled"
}

export interface IGxpServiceAppModule {
  _id: string;
  moduleName: string;
  status: STATUS;
  createdBy: string;
}

const GxpServiceAppModuleSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "enabled"
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

GxpServiceAppModuleSchema.index({ moduleName: 1 }, { unique: true });

export const GxpServiceAppModuleModel = mongoose.model(
  "GxpServiceAppModule",
  GxpServiceAppModuleSchema
);
