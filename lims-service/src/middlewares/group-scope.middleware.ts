import { Request, Response, NextFunction } from "express";

export const groupScope = (req: Request, _res: Response, next: NextFunction): void => {
  const headerGroupId = req.headers["x-group-id"] as string | undefined;

  // Attach to request so services can use it
  (req as any).groupId = headerGroupId || (req.user as any)?.defaultGroupId || null;

  next();
};
