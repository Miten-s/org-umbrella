import mongoose, { Schema } from "mongoose";

const GxpServiceAppModuleSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    moduleName: {
      type: String,
      enum: ["User", "Resolver"],
      required: true
    },
    active: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Role"
    },
    status: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "enabled"
    }
  },
  {
    timestamps: true
  }
);

const GxpServiceAppModuleModel = mongoose.model(
  "GxpServiceAppModule",
  GxpServiceAppModuleSchema
);

GxpServiceAppModuleSchema.index({ appId: 1, moduleName: 1 }, { unique: true });

export default GxpServiceAppModuleModel;
