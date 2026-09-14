import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import ENV from "../utils/environment";
import { CUSTOM_MESSAGES } from "../utils/common.util";

export const loginService = async ({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<string> => {
  // Same normalization as the model's own `set()` — needed here too since a WHERE clause
  // is a literal comparison, not a write, so the field setter never runs on it.
  const user = await User.findOne({
    where: { email: email?.trim().toLowerCase() }
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error(CUSTOM_MESSAGES.INVALID_EMAIL_PASSWORD);
  }

  // Generating Non Expiring Token
  const token = jwt.sign({ id: user.id, email: user.email }, ENV.JWT_SECRET!);

  // Saving Last Login
  user.lastLogin = new Date();
  await user.save();

  return token;
};
