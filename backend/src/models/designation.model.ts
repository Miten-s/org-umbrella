import { Schema, model, Document } from "mongoose";

interface IDesignation extends Document {
  _id: string;
  designationName: string;
  description?: string;
  status: "active" | "disabled";
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
    }
  },
  { timestamps: true }
);

export const Designation = model<IDesignation>(
  "Designation",
  DesignationSchema
);
