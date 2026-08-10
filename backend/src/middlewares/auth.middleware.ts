import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";
import { IUser, User } from "../models/user.model";
import { Role } from "../models/role.model";
import { Permission } from "../models/permission.model";
import API_ROUTES from "../utils/routes";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  if (
    req.route?.path?.includes(API_ROUTES.LOGOUT) ||
    req.route?.path?.includes(API_ROUTES.LOGIN)
  ) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET!) as IUser;
    const userId = decoded.id;

    const fetchedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["id", "name", "type"],
          include: [
            {
              model: Permission,
              as: "permissions",
              attributes: ["id", "name"]
            }
          ]
        }
      ]
    });

    if (!fetchedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = fetchedUser.toJSON() as any;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
