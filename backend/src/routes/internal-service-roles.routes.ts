import { Router } from "express";
import { authenticateInternalService } from "../middlewares/internal-service.middleware";
import {
  createRole,
  listPermissions,
  lookupRoles,
  queryRoles,
  registerCatalogue,
  removeRoles,
  restoreRoles,
  updateRole
} from "../controllers/internal-service-roles.controller";

const router: Router = Router();

// Role definitions owned by a service (lims, gxp). Service key only; the service in front
// authorises its own users before calling.
router.use("/service-roles", authenticateInternalService);

router.post("/service-roles/:service/query", queryRoles);
router.post("/service-roles/:service/lookup", lookupRoles);
router.post("/service-roles/:service/remove", removeRoles);
router.post("/service-roles/:service/restore", restoreRoles);
router.put("/service-roles/:service/catalogue", registerCatalogue);
router.post("/service-roles/:service/permissions", listPermissions);
router.post("/service-roles/:service", createRole);
router.patch("/service-roles/:service/:id", updateRole);

export default router;
