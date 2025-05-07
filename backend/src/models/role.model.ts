import mongoose, { Document, Schema } from "mongoose";

export interface IRole extends Document {
  _id : string,
  organization: string;
  name: string;
  permissions: string[];
}

const RoleSchema = new Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true, unique: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
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
