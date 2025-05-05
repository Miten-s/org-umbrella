import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  roles: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  this.set("updatedAt", Date.now());
});

export const User = mongoose.model<IUser>("User", UserSchema);
