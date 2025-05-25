import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  logo?: string;
  description?: string;
}

const CompanySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>("Company", CompanySchema);
