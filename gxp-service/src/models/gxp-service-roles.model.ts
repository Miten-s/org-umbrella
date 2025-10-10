import mongoose, { Schema } from "mongoose";
const { ObjectId } = mongoose.Types;

const generateSrvId = () => {
  const objectId = new ObjectId();
  return `SRV_${objectId.toHexString()}`;
};

const GxpServicePortalRoleSchema = new Schema(
  {
    _id: {
      type: String,
      default: generateSrvId
    },
    roleName: {
      type: String,
      required: true,
      maxlength: 20,
      validate: {
        validator: (v: string) => v.startsWith("Service"),
        message: "Role name must start with Service"
      }
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "GxpServicePortalPermissions",
        required: true
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
    status: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "disabled"
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

const GxpServicePortalRole = mongoose.model(
  "GxpServicePortalRole",
  GxpServicePortalRoleSchema
);

export default GxpServicePortalRole;
