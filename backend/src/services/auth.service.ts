import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import ENV from "../utils/environment";
import { CUSTOM_MESSAGES } from "../utils/common.util";

export const loginService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<string> => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error(CUSTOM_MESSAGES.INVALID_EMAIL_PASSWORD);
  }

  // Generating Non Expiring Token
  const token = jwt.sign({ id: user._id , username: user.username , email: user.email }, ENV.JWT_SECRET!);

  return token;
};
