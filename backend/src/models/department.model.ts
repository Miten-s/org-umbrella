import mongoose from "mongoose";

export interface IDepartment extends Document {
  _id: string;
  departmentName: string;
  departmentManager: string;
  departmentGroupLocation: string;
  description?: string;
  createdOn?: Date;
  createdBy?: string;
  modifiedOn?: Date;
  modifiedBy?: string;
  status: "active" | "disabled";
  deletedAt: Date;
}

const DepartmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      unique: true
    },
    departmentManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    departmentGroupLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
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
    },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

DepartmentSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  async function () {
    this.where({ deletedAt: null });
  }
);

DepartmentSchema.pre("save", async function () {
  this.set("modifiedOn", new Date());
});

export const Department = mongoose.model("Department", DepartmentSchema);
