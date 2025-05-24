import { Request, Response, NextFunction } from "express";

export const checkPermissions = (requiredPermissions = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions =
      req.user?.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.name)
      ) ?? [];

    const hasAll = requiredPermissions.every((p) =>
      userPermissions.includes(p)
    );

    if (!hasAll) return res.status(403).json({ message: "Unauthorized user" });

    next(); // permission is OK, move on
  };
};
