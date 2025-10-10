import mongoose from "mongoose";

const GxpServiceRequestComment = new mongoose.Schema(
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

const GxpRequesComments = mongoose.model(
  "GxpServiceRequestComment",
  GxpServiceRequestComment
);

export default GxpRequesComments;
