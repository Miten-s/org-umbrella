import { Request, Response, NextFunction } from "express";
import { isSuperAdmin } from "../utils/common.util";

export const checkPermissions = (requiredPermissions: string[] = []): any => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions =
      (req.user?.roles ?? []).flatMap((role) =>
        role.permissions?.map((permission) => permission.name)
      ) ?? [];

    const hasSome = requiredPermissions.some((p) =>
      userPermissions.includes(p)
    );

    if (!hasSome && !isSuperAdmin(req.user))
      return res.status(403).json({ error: "permission denied" });

    next();
  };
};
