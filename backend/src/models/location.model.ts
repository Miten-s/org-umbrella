import { Schema, model, Document } from "mongoose";

export interface ILocation extends Document {
  _id: string;
  locationName: string;
  description?: string;
  comments?: string;
  status: "active" | "disabled";
}

const LocationSchema = new Schema<ILocation>(
  {
    locationName: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      default: ""
    },
    comments: {
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

export const Location = model<ILocation>("Location", LocationSchema);
