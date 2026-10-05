import { Router } from "express";
import API_ROUTES from "../utils/routes";
import { authenticateInternalService } from "../middlewares/internal-service.middleware";
import {
  getPermissionsForUser,
  getPermissionsForRoles
} from "../controllers/internal-permissions.controller";

const router: Router = Router();

// Mounted at API_ROUTES.INTERNAL by app.ts — outside /v1/api, so no nginx location can
// proxy to it. Not behind end-user auth either — guarded by authenticateInternalService.
// Only lims-service/gxp-service should ever call these.
router.use(API_ROUTES.PERMISSION, authenticateInternalService);

router.get(API_ROUTES.PERMISSION + "/by-roles", getPermissionsForRoles);

router.get(API_ROUTES.PERMISSION + "/user/:userId", getPermissionsForUser);

export default router;
