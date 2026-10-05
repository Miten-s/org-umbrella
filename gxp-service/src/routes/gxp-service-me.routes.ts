import { Router, Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getGxpUserContext } from "../services/user-context.service";
import {
  GXP_ACTIONS,
  GXP_ENTITIES,
  permissionCode
} from "../utils/permissions";

/** What can the CURRENT platform user do in GXP — the frontend has no other way to find
 * out, since access here is granted via GXP's own Users screen (gxp_users.roles), which
 * the platform's own /auth/me has no visibility into (see ROLES_AND_ACCESS_MANAGEMENT.md).
 * Sidebar visibility and route guards both key off this. No `authorize` gate — any
 * authenticated platform user may ask "what can I do here", even when the answer is nothing. */
const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const platformUserId = req.user?.id;
    if (!platformUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const context = await getGxpUserContext(platformUserId);
    if (!context) {
      return res.status(200).json({ permissions: [] });
    }

    // A wildcard (isSuperAdmin, or holding GXP:OPERATE:ALL) is expanded to the concrete,
    // current catalogue here — never forwarded as a bare sentinel. The frontend's own
    // Super Admin check keys off the literal platform "OPERATE:ALL" string; leaking that
    // (or an unexpanded GXP:OPERATE:ALL the frontend doesn't know how to interpret) would
    // either falsely grant platform-wide UI treatment or grant nothing at all.
    const hasWildcard =
      context.isSuperAdmin || context.permissions.has("GXP:OPERATE:ALL");
    const permissions = hasWildcard
      ? GXP_ENTITIES.flatMap((entity) =>
          GXP_ACTIONS.map((action) => permissionCode(action, entity))
        )
      : [...context.permissions];

    res.status(200).json({ permissions });
  })
);

export default router;
