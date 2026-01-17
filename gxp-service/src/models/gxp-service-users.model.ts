import mongoose from "mongoose";

const GxpServiceUserSchema = new mongoose.Schema(
  {
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true }
    },
    userType: {
      type: String,
      enum: ["User", "Resolver"],
      required: true
    },
    roles: [
      {
        type: String,
        required: true,
        ref: "Role"
      }
    ],
    description: {
      type: String,
      maxlength: 100
    },
    createdBy: {
      type: String
    },
    modifiedBy: {
      type: String
    },
    status: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "enabled"
    },
    trainingCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: "gxp-service-users"
  }
);

const GxpServiceUserModel = mongoose.model(
  "GxpServiceUser",
  GxpServiceUserSchema
);

GxpServiceUserSchema.index({ "user.id": 1, userType: 1 }, { unique: true });

export default GxpServiceUserModel;
