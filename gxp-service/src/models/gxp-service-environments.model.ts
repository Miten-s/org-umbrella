import mongoose, { Schema } from "mongoose";
import { STATUS } from "../types/common.types";

export interface Environment {
  environmentName: string;
  description: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
  status: STATUS;
}

const GxpServiceEnvironmentSchema = new Schema(
  {
    environmentName: {
      type: String,
      required: true,
      maxlength: 20,
      unique: true
    },
    description: {
      type: String,
      maxlength: 50
    },
    createdOn: {
      type: Date,
      default: null
    },
    createdBy: {
      type: String
    },
    modifiedOn: {
      type: Date,
      default: null
    },
    modifiedBy: {
      type: String,
      maxlength: 40,
      default: ""
    },
    status: {
      type: String,
      enum: STATUS,
      default: true
    }
  },
  { timestamps: false, collection: "gxp-service-enironments" }
);

const GxpServiceEnvironmentModel = mongoose.model<Environment>(
  "GxpServiceEnvironment",
  GxpServiceEnvironmentSchema
);

export default GxpServiceEnvironmentModel;
