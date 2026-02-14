import { Schema, model, Document } from "mongoose";

export interface IDesignation extends Document {
  designationName: string;
  description?: string;
  status: "active" | "disabled";
  deletedAt: Date;
  modifiedOn?: Date;
  modifiedBy?: string;
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
    modifiedOn: { type: Date },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

DesignationSchema.pre(
  ["find", "findOne", "findOneAndUpdate"],
  async function () {
    this.where({ deletedAt: null });
  }
);

DesignationSchema.pre("save", async function () {
  this.set("modifiedOn", new Date());
});

export const Designation = model<IDesignation>(
  "Designation",
  DesignationSchema
);
