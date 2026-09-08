import { Request, Response, NextFunction } from "express";
import { isSuperAdmin } from "../utils/common.util";

export const checkPermissions = (requiredPermissions: string[] = []): any => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles: any[] = (req.user as any)?.roles ?? [];
    const userPermissions = roles.flatMap((role: any) =>
      (role.permissions ?? []).map((permission: any) => permission.name)
    );

    const hasSome = requiredPermissions.some((p) =>
      userPermissions.includes(p)
    );

    if (!hasSome && !isSuperAdmin(req.user as any))
      return res.status(403).json({ error: "permission denied" });

    next();
  };
};
