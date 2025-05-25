import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { IRole } from "./role.model";

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  roles: IRole[];
}

const UserSchema: Schema = new Schema(
  {
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
    roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    deletedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.set("password", await bcrypt.hash(this.password as string, 10));
  }
  this.set("updatedAt", Date.now());
});

UserSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.where({ deletedAt: null });
  this.populate("createdBy", "username");
});

export const User = mongoose.model<IUser>("User", UserSchema);
