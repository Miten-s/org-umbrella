import { Router } from "express";
import {
  handleCreateTestProtocol,
  handleCreateTestCase,
  handleCreateTestStep,
  handleGetProtocolsByProject
} from "../controllers/test-protocol.controller";

const router = Router();

router.post("/", handleCreateTestProtocol);
router.post("/cases", handleCreateTestCase);
router.post("/steps", handleCreateTestStep);
router.get("/project/:projectId", handleGetProtocolsByProject);

export default router;
