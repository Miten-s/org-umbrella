import { Router } from "express";

import {
  createEnvironment,
  deleteEnvironment,
  getEnvironments,
  enableEnvironment,
  updateEnvironment,
  disableEnvironment
} from "../controllers/gxp-service-environments.controller";
import API_ROUTES from "../utils/routes";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateEnvironmentDto, UpdateEnvironmentDto } from "../dtos/environment.dto";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ENVIRONMENT.ROOT, getEnvironments);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.ENVIRONMENT.ROOT,
  validateDto(CreateEnvironmentDto),
  createEnvironment
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.ENVIRONMENT.BY_ID,
  validateDto(UpdateEnvironmentDto),
  updateEnvironment
);

router.patch(API_ROUTES.ENVIRONMENT.ENABLE_BY_ID, enableEnvironment);

router.patch(API_ROUTES.ENVIRONMENT.DISABLE_BY_ID, disableEnvironment);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.ENVIRONMENT.BY_ID, deleteEnvironment);

export default router;
