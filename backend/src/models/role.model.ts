import mongoose, { Document, Schema } from "mongoose";
import { IPermission } from "./permission.model";

export enum RoleType {
  CUSTOM = "Custom",
  BUILT_IN = "Built_In",
  GXP_SERVICE = "Gxp_Service"
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
    type: {
      type: String,
      enum: RoleType,
      required: true,
      default: RoleType.CUSTOM
    },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

RoleSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({
    deletedAt: null
  });
  this.populate("permissions", "name description");
});

export const Role = mongoose.model<IRole>("Role", RoleSchema);
