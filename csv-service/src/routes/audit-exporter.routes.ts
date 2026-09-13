import { Router } from "express";
import { handleExportAuditPackage } from "../controllers/audit-exporter.controller";

const router = Router();

// Step 8 Audit Package Exporter (ZIP Generator)
router.get("/:id/audit-package", handleExportAuditPackage);

export default router;
