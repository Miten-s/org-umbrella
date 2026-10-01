import { Router } from "express";
import { authenticateInternalService } from "../middlewares/internal-service.middleware";
import { syncLimsRolesHandler } from "../controllers/internal-lims-roles.controller";

const router: Router = Router();

// Mounted at API_ROUTES.INTERNAL by app.ts, outside /v1/api, so no nginx location can
// reach it. Only lims-service should ever call this. The guard is applied to the path
// rather than router-wide because app.ts mounts more than one router on the same prefix.
router.put(
  "/lims-roles/sync",
  authenticateInternalService,
  syncLimsRolesHandler
);

export default router;
