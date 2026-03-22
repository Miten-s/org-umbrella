import mongoose, { Schema, Document } from "mongoose";

export interface IServiceRequestCounter extends Document {
  application: string;
  seq: number;
}

const GxpServiceRequestCounterSchema = new Schema<IServiceRequestCounter>(
  {
    application: {
      type: String,
      ref: "GxpServiceApplication",
      required: true,
      unique: true,
      index: true
    },
    seq: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: false,
    collection: "gxp-service-service-request-counters"
  }
);

const GxpServiceRequestCounterModel = mongoose.model<IServiceRequestCounter>(
  "GxpServiceRequestCounter",
  GxpServiceRequestCounterSchema
);

export default GxpServiceRequestCounterModel;
