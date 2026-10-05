import { Request, Response, NextFunction } from "express";
import ENV from "../utils/environment";

/** Guards routes meant only for other services (lims-service/gxp-service), never end users
 * or the public nginx gateway. Checked via a shared secret, not the end-user JWT flow. */
export const authenticateInternalService = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const providedKey = req.headers["x-internal-api-key"];

  if (
    !ENV.INTERNAL_API_KEY ||
    !providedKey ||
    providedKey !== ENV.INTERNAL_API_KEY
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
