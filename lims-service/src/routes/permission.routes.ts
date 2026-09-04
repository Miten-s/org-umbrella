import { Router, Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getPermissionCatalogue } from "../services/permission.service";
import { authorize } from "../middlewares/authorize.middleware";

/** The permission catalogue — read-only, feeds the Role form's Entry dropdown. Guarded by
 * VIEW:ROLE rather than its own permission — a 27th entity for a static list would be noise. */
const router = Router();

router.get(
  "/",
  authorize("ROLE", "VIEW"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ data: await getPermissionCatalogue() });
  })
);

export default router;
