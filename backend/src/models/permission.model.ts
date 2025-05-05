import mongoose, { Document, Schema } from "mongoose";

export interface IPermission extends Document {
  organization: string;
  name: string;
  description: string;
}

const PermissionSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

PermissionSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

export const Permission = mongoose.model<IPermission>(
  "Permission",
  PermissionSchema
);
