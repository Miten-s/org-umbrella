import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  getAllWorkflows,
  createWorkflow,
  updateWorkflow,
  disableWorkflow,
  enableWorkflow,
  deleteWorkflow
} from "../controllers/gxp-service-workflows.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.WORKFLOWS.ROOT, getAllWorkflows);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.WORKFLOWS.ROOT, createWorkflow);

// ---------------------------------------------------------------------------------------- PUT Requests ----------------------------------------------------------------------------------------

router.patch(API_ROUTES.WORKFLOWS.ENABLE_BY_ID, enableWorkflow);

router.patch(API_ROUTES.WORKFLOWS.DISABLE_BY_ID, disableWorkflow);

router.patch(API_ROUTES.WORKFLOWS.BY_ID, updateWorkflow);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.WORKFLOWS.BY_ID, deleteWorkflow);

export default router;
