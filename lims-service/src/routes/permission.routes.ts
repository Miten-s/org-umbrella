import { Router, Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getPermissionCatalogue } from "../services/permission.service";
import { authorize } from "../middlewares/authorize.middleware";

/**
 * The permission catalogue — read-only. Feeds the Entry dropdown on the Lab
 * Role form so it can stop being a free-text box.
 *
 * Guarded by VIEW:ROLE rather than a permission of its own: the only reason to
 * read the catalogue is to build a role, and inventing a 27th entity for a
 * static list nobody can modify would be noise.
 */
const router = Router();

router.get(
  "/",
  authorize("ROLE", "VIEW"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ data: await getPermissionCatalogue() });
  })
);

export default router;
