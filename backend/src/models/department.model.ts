import mongoose from "mongoose";

export interface IDepartment extends Document {
  _id: string;
  department_name: string;
  department_manager: string;
  department_group_location: string;
  description?: string;
  created_on?: Date;
  created_by?: string;
  modified_on?: Date;
  modified_by?: string;
  status: "active" | "disabled";
}

const DepartmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true
    },
    departmentManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    departmentGroupLocation: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    createdBy: {
      type: String,
      default: null
    },
    modifiedOn: {
      type: Date,
      default: null
    },
    modifiedBy: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active"
    }
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", DepartmentSchema);
