import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import ENV from "../utils/environment";
import { CUSTOM_MESSAGES } from "../utils/common.util";

/** Tokens were previously signed with no `exp` at all, so every token ever issued stayed
 * valid forever. There is no refresh endpoint yet, so this is deliberately long: users are
 * logged out once a day until the refresh path lands. */
export const ACCESS_TOKEN_TTL = "24h";
export const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

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

  const token = jwt.sign({ id: user.id, email: user.email }, ENV.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_TTL
  });

  // Saving Last Login
  user.lastLogin = new Date();
  await user.save();

  return token;
};
