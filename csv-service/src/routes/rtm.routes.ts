import { Router } from "express";
import {
  handleGetRtmMatrix,
  handleSyncRtmMatrix
} from "../controllers/rtm.controller";

const router = Router();

router.get("/project/:projectId", handleGetRtmMatrix);
router.post("/sync/:projectId", handleSyncRtmMatrix);

export default router;
