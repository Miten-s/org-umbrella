import { Router, Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getUserContext } from "../services/user-context.service";
import {
  LIMS_ACTIONS,
  LIMS_ENTITIES,
  permissionCode
} from "../utils/permissions";

/** What can the CURRENT platform user do in LIMS — the frontend has no other way to find
 * out, since access here is granted via LIMS's own Lab Users screen (lims_users/roles),
 * which the platform's own /auth/me has no visibility into (see
 * ROLES_AND_ACCESS_MANAGEMENT.md). Sidebar visibility and route guards both key off this.
 * No `authorize` gate — any authenticated platform user may ask "what can I do here", even
 * when the answer is nothing. Mirrors gxp-service/src/routes/gxp-service-me.routes.ts. */
const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const platformUserId = req.user?.id;
    if (!platformUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const context = await getUserContext(platformUserId);
    if (!context) {
      return res.status(200).json({ permissions: [] });
    }

    // `operateAll` (whether from a genuinely LIMS-scoped role or the platform Super Admin
    // bypass baked into getUserContext) is expanded to the concrete, current catalogue —
    // never forwarded as the bare "OPERATE:ALL" string. That literal string is also what
    // the frontend's OWN Super Admin check keys off of; leaking it here would falsely grant
    // platform-wide UI treatment to someone who only has full access within LIMS.
    const permissions = context.operateAll
      ? LIMS_ENTITIES.flatMap((entity) =>
          LIMS_ACTIONS.map((action) => permissionCode(action, entity))
        )
      : [...context.permissions];

    res.status(200).json({ permissions });
  })
);

export default router;
