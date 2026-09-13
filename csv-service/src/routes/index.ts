import { Router } from "express";
import applicationRoutes from "./application.routes";
import projectRoutes from "./project.routes";
import requirementRoutes from "./requirement.routes";
import impactAssessmentRoutes from "./impact-assessment.routes";
import specRoutes from "./spec.routes";
import riskRoutes from "./risk.routes";
import rtmRoutes from "./rtm.routes";
import testProtocolRoutes from "./test-protocol.routes";
import executionRoutes from "./execution.routes";
import discrepancyRoutes from "./discrepancy.routes";
import signatureRoutes from "./signature.routes";
import auditExporterRoutes from "./audit-exporter.routes";
import periodicReviewRoutes from "./periodic-review.routes";

const router = Router();

router.use("/applications", applicationRoutes);
router.use("/projects", projectRoutes);
router.use("/projects", auditExporterRoutes);
router.use("/requirements", requirementRoutes);
router.use("/impact-assessments", impactAssessmentRoutes);
router.use("/specs", specRoutes);
router.use("/risks", riskRoutes);
router.use("/rtm", rtmRoutes);
router.use("/test-protocols", testProtocolRoutes);
router.use("/executions", executionRoutes);
router.use("/discrepancies", discrepancyRoutes);
router.use("/signatures", signatureRoutes);
router.use("/periodic-reviews", periodicReviewRoutes);

export default router;
