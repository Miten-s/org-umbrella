import mongoose, { Document, Schema } from "mongoose";

export interface IGxpSupplier extends Document {
  supplierName: string;
  typeOfSupplier?: string;
  product?: string;
  description?: string | null;
  createdOn?: Date | null;
  createdBy?: string | null;
  modifiedOn?: Date | null;
  modifiedBy?: string | null;
  status: "enabled" | "disabled";
}

const GxpSupplierSchema = new Schema<IGxpSupplier>(
  {
    supplierName: { type: String, required: true, maxlength: 20, trim: true },
    typeOfSupplier: { type: String, trim: true },
    product: { type: String, default: "" },
    description: { type: String, maxlength: 50, default: null, trim: true },
    createdOn: { type: Date, default: null },
    createdBy: { type: String, maxlength: 40, default: null, trim: true },
    modifiedOn: { type: Date, default: null },
    modifiedBy: { type: String, maxlength: 40, default: null, trim: true },
    status: { type: String, enum: ["enabled", "disabled"], default: "enabled" }
  },
  {
    timestamps: false,
    collection: "gxp_suppliers"
  }
);

export const GxpSupplierModel = mongoose.model<IGxpSupplier>(
  "GxpSupplier",
  GxpSupplierSchema
);
