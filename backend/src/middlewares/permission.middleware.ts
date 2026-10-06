import { Request, Response, NextFunction } from "express";
import { isSuperAdmin, getUserPermissionNames } from "../utils/common.util";

export const checkPermissions = (requiredPermissions: string[] = []): any => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = getUserPermissionNames(req.user as any);

    const hasSome = requiredPermissions.some((p) =>
      userPermissions.includes(p)
    );

    if (!hasSome && !isSuperAdmin(req.user as any))
      return res.status(403).json({ error: "permission denied" });

    next();
  };
};

/** Company setup has no dedicated permission code — treat it as Super-Admin-only,
 * matching what the sidebar already assumes (gated behind OPERATE:ALL). */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isSuperAdmin(req.user as any)) {
    return res.status(403).json({ error: "permission denied" });
  }
  next();
};
