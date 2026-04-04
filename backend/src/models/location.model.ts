import { Schema, model, Document } from "mongoose";

export interface ILocation extends Document {
  locationName: string;
  description?: string;
  comments?: string;
  status: "active" | "disabled";
  deletedAt: Date;
  modifiedOn?: Date;
  modifiedBy?: string;
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
    modifiedOn: { type: Date },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

LocationSchema.pre(
  ["find", "findOne", "findOneAndUpdate", "countDocuments"],
  async function () {
    if (this.getOptions()?.includeDeleted) return;
    this.where({ deletedAt: null });
  }
);

LocationSchema.pre("save", async function () {
  this.set("modifiedOn", new Date());
});

export const Location = model<ILocation>("Location", LocationSchema);
