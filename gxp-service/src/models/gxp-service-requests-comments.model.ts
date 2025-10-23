import mongoose from "mongoose";

const GxpServiceRequestCommentSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      ref: "GxpServiceRequest",
      required: true
    },
    comments: {
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      required: true
    },
    createdBy: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const GxpRequestCommentsModel = mongoose.model(
  "GxpServiceRequestComment",
  GxpServiceRequestCommentSchema
);

export default GxpRequestCommentsModel;
