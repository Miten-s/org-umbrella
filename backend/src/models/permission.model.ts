import mongoose, { Document, Schema } from "mongoose";

export interface IPermission extends Document {
  _id: string;
  name: string;
  description: string;
  deletedAt: Date;
  modifiedOn?: Date;
  modifiedBy?: string;
}
enum PermissionType {
  DEFAULT = "default",
  GXP_SERVICE = "gxp_service"
}

const PermissionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    deletedAt: { type: Date, default: null },
    type: {
      type: String,
      enum: PermissionType,
      default: PermissionType.DEFAULT
    },
    modifiedOn: { type: Date },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

PermissionSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  async function () {
    this.where({ deletedAt: null });
  }
);

export const Permission = mongoose.model<IPermission>(
  "Permission",
  PermissionSchema
);
