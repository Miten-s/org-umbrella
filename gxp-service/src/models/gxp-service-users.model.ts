import mongoose, { Schema } from "mongoose";

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
    roles: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Role"
    },
    description: {
      type: String,
      maxlength: 50
    },
    createdBy: {
      type: String,
      maxlength: 40
    },
    modifiedBy: {
      type: String,
      maxlength: 40
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
    timestamps: true
  }
);

const GxpServiceUser = mongoose.model("GxpServiceUser", GxpServiceUserSchema);

GxpServiceUserSchema.index({ "user.id": 1, userType: 1 }, { unique: true });

export default GxpServiceUser;
