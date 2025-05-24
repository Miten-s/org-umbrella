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

RoleSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({ isDeleted: false, deletedAt: null });
  this.populate("permissions", "name description");
});

export const Role = mongoose.model<IRole>("Role", RoleSchema);
