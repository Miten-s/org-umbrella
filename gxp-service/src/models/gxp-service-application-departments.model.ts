import mongoose from "mongoose";

const GxpServiceAppDepartmentSchema = new mongoose.Schema(
  {
    appId: {
      type: String,
      ref: "GxpServiceApplication",
      required: true
    },
    departmentName: {
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
    collection: "gxp-service-app-departments"
  }
);

GxpServiceAppDepartmentSchema.index(
  { appId: 1, departmentName: 1 },
  { unique: true }
);

const GxpServiceAppDepartmentModel = mongoose.model(
  "GxpServiceAppDepartments",
  GxpServiceAppDepartmentSchema
);

export default GxpServiceAppDepartmentModel;
