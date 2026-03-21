import mongoose from "mongoose";

enum STATUS {
  ENABLED = "enabled",
  DISABLED = "disabled"
}

export interface IGxpServiceAppModule {
  _id: string;
  moduleName: string;
  application?: string;
  moduleId?: string;
  status: STATUS;
  createdBy: string;
}

const GxpServiceAppModuleSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: true
    },
    application: {
      type: String,
      ref: "GxpServiceApplication"
    },
    // Intentionally generated in service as: moduleName_applicationName
    moduleId: {
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

export const GxpServiceAppModuleModel = mongoose.model(
  "GxpServiceAppModule",
  GxpServiceAppModuleSchema
);

void GxpServiceAppModuleModel.collection.dropIndex("moduleName_1").catch(() => undefined);
void GxpServiceAppModuleModel.collection.dropIndex("uniqueName_1").catch(() => undefined);
void GxpServiceAppModuleModel.updateMany({ application: "" }, { $unset: { application: 1 } }).catch(() => undefined);
