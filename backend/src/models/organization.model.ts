import mongoose, { Document, Schema } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  description: string;
}

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true , unique : true },
    description: { type: String },
  },
  { timestamps: true }
);

OrganizationSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  OrganizationSchema
);
