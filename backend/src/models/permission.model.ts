import mongoose, { Document, Schema } from "mongoose";

export interface IPermission extends Document {
  _id: string;
  organization: string;
  name: string;
  description: string;
}

const PermissionSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PermissionSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

PermissionSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  async function () {
    this.where({ isDeleted: false, deletedAt: null });
  }
);

export const Permission = mongoose.model<IPermission>(
  "Permission",
  PermissionSchema
);
