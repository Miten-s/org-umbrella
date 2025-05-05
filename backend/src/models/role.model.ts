import mongoose, { Document, Schema } from "mongoose";

export interface IRole extends Document {
  organization: string;
  name: string;
  description: string;
}

const RoleSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true, unique: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
  },
  { timestamps: true }
);

RoleSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

export const Role = mongoose.model<IRole>("Role", RoleSchema);
