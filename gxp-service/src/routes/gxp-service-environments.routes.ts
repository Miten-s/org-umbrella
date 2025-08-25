import { Router } from "express";

import {
  createEnvironmentHandler,
  getAllEnvironmentsHandler,
  updateEnvironmentHandler,
  disableEnvironmentHandler,
  restoreEnvironmentHandler,
  searchEnvironmentHandler
} from "../controllers/gxp-service-environments.controller";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get("/", getAllEnvironmentsHandler);
router.get("/search", searchEnvironmentHandler);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post("/", createEnvironmentHandler);
router.post("/restore", restoreEnvironmentHandler);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch("/:environmentName", updateEnvironmentHandler);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete("/:environmentName", disableEnvironmentHandler);

export default router;
