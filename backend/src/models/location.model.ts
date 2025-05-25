import { Schema, model, Document } from "mongoose";

export interface ILocation extends Document {
  _id: string;
  locationName: string;
  description?: string;
  comments?: string;
  status: "active" | "disabled";
  deletedAt: Date;
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
    },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

LocationSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({ deletedAt: null });
});

export const Location = model<ILocation>("Location", LocationSchema);
