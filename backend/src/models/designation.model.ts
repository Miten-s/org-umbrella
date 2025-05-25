import { Schema, model, Document } from "mongoose";

export interface IDesignation extends Document {
  _id: string;
  designationName: string;
  description?: string;
  status: "active" | "disabled";
  deletedAt: Date;
}

const DesignationSchema = new Schema<IDesignation>(
  {
    designationName: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active"
    },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

DesignationSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

DesignationSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  async function () {
    this.where({ deletedAt: null });
  }
);

export const Designation = model<IDesignation>(
  "Designation",
  DesignationSchema
);
