import mongoose, { Schema } from "mongoose";

export interface Environment {
  environmentName: string;
  description: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
  isActive: boolean;
}

const environmentSchema = new Schema(
  {
    environmentName: {
      type: String,
      required: true,
      maxlength: 20,
      unique: true,
      index: true
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
      type: String,
      maxlength: 40,
      default: ""
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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: false }
);

export const EnvironmentModel = mongoose.model<Environment>(
  "Environment",
  environmentSchema
);
