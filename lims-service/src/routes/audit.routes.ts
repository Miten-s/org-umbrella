import { Router } from "express";
import API_ROUTES from "../utils/routes";
import { getAuditLogs, getEntityAuditLogs } from "../controllers/audit.controller";

const router: Router = Router();

router.get(API_ROUTES.AUDIT, getAuditLogs);
router.get(`${API_ROUTES.AUDIT}/:entityName/:entityId`, getEntityAuditLogs);

export default router;
