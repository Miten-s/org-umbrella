import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";

export const loginService = async ({ email, password }: { email: string; password: string }): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  return token;
};

export const registerService = async ({ username, email, password }: { username: string; email: string; password: string }): Promise<IUser> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  return await newUser.save();
};
