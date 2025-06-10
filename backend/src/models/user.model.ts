import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { IRole } from "./role.model";

export interface IBasicUserFields {
  fullName?: string;
  email: string;
  name: string;
  password: string;
  currentLanguage?: string;
  userType: "Admin" | "User";
  status: "active" | "disabled";
  roles?: IRole[];
  modifiedOn?: Date;
  description?: string;
  modifiedBy?: mongoose.Types.ObjectId;
}

export interface IConditionalUserFields {
  phone?: string;
  department?: string;
  designation?: string;
  location?: string;
  modifiable?: boolean;
  manager?: string;
  trainingCompleted?: boolean;
  deletedAt?: Date | null;
  passwordExpiryTime?: Date | null;
  lastLogin?: Date | null;
  createdBy?: string;
  lastPasswords?: string[];
}

export interface IUser
  extends Document,
    IBasicUserFields,
    IConditionalUserFields {
  _id: string;
  isRecentPassword: (password: string) => Promise<boolean>;
}

const AdminSchema: Record<keyof IBasicUserFields, any> = {
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ["Admin", "User"], default: "User" },
  status: { type: String, enum: ["active", "disabled"], default: "active" },
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
  roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
  modifiedOn: { type: Date },
  description: { type: String, default: "" },
  modifiedBy: { type: Schema.Types.ObjectId, ref: "User" }
};

const ClientSchema: Record<keyof IConditionalUserFields, any> = {
  phone: { type: String },
  department: { type: Schema.Types.ObjectId, ref: "Department" },
  designation: { type: Schema.Types.ObjectId, ref: "Designation" },
  location: { type: Schema.Types.ObjectId, ref: "Location" },
  modifiable: { type: Boolean },
  manager: { type: Schema.Types.ObjectId, ref: "User" },
  trainingCompleted: { type: Boolean },
  deletedAt: { type: Date, default: null },
  passwordExpiryTime: { type: Date },
  lastLogin: { type: Date },
  lastPasswords: [{ type: String }],
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
    const hashedPassword = await bcrypt.hash(this.password as string, 10);

    // Push the new hashed password to lastPasswords
    if (this.lastPasswords) {
      (this.lastPasswords as string[]).push(hashedPassword);

      // Keep only the last 3 passwords
      if ((this.lastPasswords as string[]).length > 3) {
        this.lastPasswords = (this.lastPasswords as string[]).slice(-3);
      }
    } else {
      this.lastPasswords = [hashedPassword];
    }

    // Push the new hashed password to lastPasswords
    this.set("password", hashedPassword);

    // Default Password Expiry Time 30 days
    this.set(
      "passwordExpiryTime",
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    );

    this.set("lastPasswords", [this.password]);
  }
  this.set("modifiedOn", new Date());
});

// Method to verify if a password is one of the last 3 passwords
UserSchema.methods.isRecentPassword = async function (
  password: string
): Promise<boolean> {
  for (const oldPassword of this.lastPasswords) {
    const match = await bcrypt.compare(password, oldPassword);
    if (match) return true;
  }
  return false;
};

UserSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({ deletedAt: null });
  this.populate("createdBy", "fullName");
});

export const User = mongoose.model<IUser>("User", UserSchema);
