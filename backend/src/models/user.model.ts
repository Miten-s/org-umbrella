import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { IRole } from "./role.model";

export interface IBasicUserFields {
  username: string;
  email: string;
  name: string;
  password: string;
  currentLanguage?: string;
  roles?: IRole[];
}

export interface IConditionalUserFields {
  phone?: string;
  department?: mongoose.Types.ObjectId;
  designation?: mongoose.Types.ObjectId;
  location?: mongoose.Types.ObjectId;
  modifiable?: boolean;
  manager?: mongoose.Types.ObjectId;
  trainingCompleted?: boolean;
  deletedAt?: Date | null;
  passwordExpiryTime?: Date | null;
  createdBy?: mongoose.Types.ObjectId;
}

export interface IUser
  extends Document,
    IBasicUserFields,
    IConditionalUserFields {
  _id: string;
}

const AdminSchema: Record<keyof IBasicUserFields, any> = {
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  currentLanguage: {
    type: String,
    enum: [
      "en",
      "ar",
      "zh",
      "de",
      "es",
      "fr",
      "he",
      "it",
      "ja",
      "ko",
      "nl",
      "pl",
      "pt"
    ],
    default: "en"
  },
  roles: [{ type: Schema.Types.ObjectId, ref: "Role" }]
};

const ClientSchema: Record<keyof IConditionalUserFields, any> = {
  phone: { type: String },
  department: { type: Schema.Types.ObjectId, ref: "Department" },
  designation: { type: Schema.Types.ObjectId, ref: "Designation" },
  location: { type: Schema.Types.ObjectId, ref: "Location" },
  modifiable: { type: Boolean },
  manager: { type: Schema.Types.ObjectId, ref: "User" },
  trainingCompleted: { type: Boolean },
  deletedAt: { type: Date },
  passwordExpiryTime: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" }
};

const UserSchema: Schema = new Schema(
  {
    ...AdminSchema,
    ...ClientSchema
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.set("password", await bcrypt.hash(this.password as string, 10));
  }
});

UserSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({ deletedAt: null });
  this.populate("createdBy", "username");
});

export const User = mongoose.model<IUser>("User", UserSchema);
