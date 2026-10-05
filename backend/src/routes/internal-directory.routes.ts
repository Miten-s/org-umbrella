import { Router } from "express";
import { authenticateInternalService } from "../middlewares/internal-service.middleware";
import {
  lookupDepartments,
  lookupLocations,
  lookupRoles,
  lookupUsers
} from "../controllers/internal-directory.controller";

const router: Router = Router();

// Mounted at API_ROUTES.INTERNAL like the permission lookups: service key only.
router.use("/directory", authenticateInternalService);

router.post("/directory/users", lookupUsers);
router.post("/directory/locations", lookupLocations);
router.post("/directory/departments", lookupDepartments);
router.post("/directory/roles", lookupRoles);

export default router;
