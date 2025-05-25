import mongoose, { Document, Schema } from "mongoose";

export interface IPermission extends Document {
  _id: string;
  name: string;
  description: string;
}

const PermissionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    deletedAt: { type: Date, default: null }
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
