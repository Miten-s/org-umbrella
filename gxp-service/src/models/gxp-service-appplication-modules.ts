import mongoose, { Schema } from "mongoose";

const GxpServiceAppModule = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "Application",
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

const GxpServiceUser = mongoose.model(
  "GxpServiceAppModule",
  GxpServiceAppModule
);

GxpServiceAppModule.index({ appId: 1, moduleName: 1 }, { unique: true });

export default GxpServiceUser;
