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
        roleId: {
          type: String,
          match: /^SRV~/,
          required: true
        },
        roleName: {
          type: String,
          match: /^Service/,
          required: true
        }
      }
    ],
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
