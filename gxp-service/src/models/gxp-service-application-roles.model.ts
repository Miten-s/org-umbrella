import mongoose from "mongoose";

const GxpServiceAppDepartment = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "Application",
      required: true
    },
    role: {
      type: String,
      enum: ["User", "Resolver"],
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

const GxpServiceDepartment = mongoose.model(
  "GxpServiceAppDepartment",
  GxpServiceAppDepartment
);

GxpServiceAppDepartment.index(
  { appId: 1, departmentName: 1 },
  { unique: true }
);

export default GxpServiceDepartment;
