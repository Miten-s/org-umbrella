import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  searchWorkflows,
  getAllWorkflows,
  createWorkflow,
  updateWorkflow,
  disableWorkflow,
  restoreWorkflow
} from "../controllers/gxp-service-workflows.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ROOT, (req, res) => {
  res.send("GXP Service Workflows API");
});

router.get("/search", searchWorkflows);
router.get("/", getAllWorkflows);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post("/", createWorkflow);
router.post("/restore", restoreWorkflow);

// ---------------------------------------------------------------------------------------- PUT Requests ----------------------------------------------------------------------------------------

router.patch("/:workflowId", updateWorkflow);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete("/:workflowId", disableWorkflow);

export default router;
