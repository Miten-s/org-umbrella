import mongoose, { Document, Schema } from "mongoose";
import { IPermission } from "./permission.model";

export enum RoleType {
  CUSTOM = "Custom",
  BUILT_IN = "Built_In"
}
export interface IRole extends Document {
  _id: string;
  name: string;
  permissions: IPermission[];
}

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    isDeleted: { type: Boolean, default: false },
    type: { type: String, enum: RoleType, required: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

RoleSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

// Question 1  : why you have not fetched role & permission if we have name supplier admin
// (resone) : for me i can't able to fetch roles and that's why i m faching issue in frontend (when i try to login with super admin) 
RoleSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({
    isDeleted: false,
    deletedAt: null,
    // name: { $not: "Super Admin" }
  });
  this.populate("permissions", "name description");
});

export const Role = mongoose.model<IRole>("Role", RoleSchema);
