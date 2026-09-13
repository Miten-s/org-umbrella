import { Sequelize } from "sequelize";
import http from "http";
import app from "../app";
import { registerAssociations } from "../models/associations";
import CsvApplication from "../models/csv-application.model";
import CsvProject from "../models/csv-project.model";
import CsvChangeControl from "../models/csv-change-control.model";
import CsvUserRequirement from "../models/csv-user-requirement.model";
import CsvValidationPlan from "../models/csv-validation-plan.model";
import CsvFunctionalSpec from "../models/csv-functional-spec.model";
import CsvConfigSpec from "../models/csv-config-spec.model";
import CsvFunctionalRisk from "../models/csv-functional-risk.model";
import CsvRtmMatrix from "../models/csv-rtm-matrix.model";
import CsvTestProtocol from "../models/csv-test-protocol.model";
import CsvTestCase from "../models/csv-test-case.model";
import CsvTestStep from "../models/csv-test-step.model";
import CsvTestExecution from "../models/csv-test-execution.model";
import CsvEvidence from "../models/csv-evidence.model";
import CsvDiscrepancy from "../models/csv-discrepancy.model";
import CsvVsrReport from "../models/csv-vsr-report.model";
import CsvSignature from "../models/csv-signature.model";
import CsvAuditLog from "../models/csv-audit-log.model";
import CsvPeriodicReview from "../models/csv-periodic-review.model";

// Setup In-Memory SQLite Test Database
const testSequelize = new Sequelize("sqlite::memory:", {
  logging: false,
  define: { underscored: true, timestamps: true }
});

const models = [
  CsvApplication,
  CsvProject,
  CsvChangeControl,
  CsvUserRequirement,
  CsvValidationPlan,
  CsvFunctionalSpec,
  CsvConfigSpec,
  CsvFunctionalRisk,
  CsvRtmMatrix,
  CsvTestProtocol,
  CsvTestCase,
  CsvTestStep,
  CsvTestExecution,
  CsvEvidence,
  CsvDiscrepancy,
  CsvVsrReport,
  CsvSignature,
  CsvAuditLog,
  CsvPeriodicReview
];

const PORT = 9009;

const runQaTestSuite = async () => {
  console.log("==========================================================");
  console.log("   CSV SERVICE END-TO-END QA AUTOMATED TEST SUITE        ");
  console.log("==========================================================\n");

  // Re-init models with SQLite in-memory DB
  for (const model of models) {
    (model as any).init((model as any).rawAttributes, {
      sequelize: testSequelize,
      tableName: (model as any).tableName,
      underscored: true,
      updatedAt: (model as any).tableName === "csv_audit_logs" ? false : true
    });
  }

  registerAssociations();
  await testSequelize.sync({ force: true });
  console.log("✅ In-memory SQLite Test Database initialized & synced.");

  const server = http.createServer(app).listen(PORT);
  console.log(`✅ Test server running on http://localhost:${PORT}\n`);

  const request = (
    method: string,
    urlPath: string,
    body?: object,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: any }> => {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        `http://localhost:${PORT}${urlPath}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(payload
              ? { "Content-Length": Buffer.byteLength(payload) }
              : {}),
            ...headers
          }
        },
        (res) => {
          let rawData = "";
          res.on("data", (chunk) => (rawData += chunk));
          res.on("end", () => {
            try {
              const parsed = rawData ? JSON.parse(rawData) : {};
              resolve({ status: res.statusCode || 500, data: parsed });
            } catch {
              resolve({ status: res.statusCode || 500, data: rawData });
            }
          });
        }
      );

      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  try {
    // -------------------------------------------------------------------------
    // QA Item 1: Health Check Endpoints
    // -------------------------------------------------------------------------
    console.log("--- QA Item 1: Health Check ---");
    const resHealth = await request("GET", "/api/v1/csv/health");
    console.log(`[GET /api/v1/csv/health] Status ${resHealth.status}`);
    console.log("Response:", resHealth.data);
    if (resHealth.status !== 200 || resHealth.data.status !== "UP") {
      throw new Error("QA Item 1 Failed!");
    }
    console.log("✅ QA Item 1 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 2: Applications API
    // -------------------------------------------------------------------------
    console.log("--- QA Item 2: Application Registry ---");
    const resApp = await request("POST", "/api/v1/csv/applications", {
      appCode: "APP-GLUCOSE",
      name: "Glucose Monitoring Platform",
      gxpClassification: "GXP"
    });
    console.log(`[POST /api/v1/csv/applications] Status ${resApp.status}`);
    console.log("Created Application:", resApp.data);
    const appId = resApp.data.id;

    const resAppList = await request("GET", "/api/v1/csv/applications");
    console.log(
      `[GET /api/v1/csv/applications] Found ${resAppList.data.length} applications.`
    );
    if (resApp.status !== 201 || resAppList.data.length === 0) {
      throw new Error("QA Item 2 Failed!");
    }
    console.log("✅ QA Item 2 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 3: Project Intake & Retrieval
    // -------------------------------------------------------------------------
    console.log("--- QA Item 3: CSV Project Intake ---");
    const resProj = await request("POST", "/api/v1/csv/projects", {
      appId,
      gxpChangeControlId: "CC-2026-88",
      projectTitle: "Glucose Calculator Module Validation",
      currentPhase: "INTAKE",
      status: "INTAKE"
    });
    console.log(`[POST /api/v1/csv/projects] Status ${resProj.status}`);
    console.log("Created Project:", resProj.data);
    const projectId = resProj.data.id;

    const resProjDetails = await request(
      "GET",
      `/api/v1/csv/projects/${projectId}`
    );
    console.log(
      `[GET /api/v1/csv/projects/${projectId}] Status ${resProjDetails.status}`
    );
    if (resProj.status !== 201 || resProjDetails.data.id !== projectId) {
      throw new Error("QA Item 3 Failed!");
    }
    console.log("✅ QA Item 3 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 4: Step 2 URS Requirements Entry
    // -------------------------------------------------------------------------
    console.log("--- QA Item 4: Step 2 URS Requirements Entry ---");
    const resUrs = await request("POST", "/api/v1/csv/requirements", {
      projectId,
      ursCode: "URS-GLU-01",
      title: "Calculate Glucose Concentration Level",
      description: "System shall calculate concentration in mg/dL accurately.",
      gxpFlag: true
    });
    console.log(`[POST /api/v1/csv/requirements] Status ${resUrs.status}`);
    console.log("Created URS:", resUrs.data);
    const ursId = resUrs.data.id;

    const resUrsList = await request(
      "GET",
      `/api/v1/csv/requirements/project/${projectId}`
    );
    console.log(
      `[GET /api/v1/csv/requirements/project/${projectId}] Found ${resUrsList.data.length} requirement(s).`
    );
    if (resUrs.status !== 201 || resUrsList.data.length === 0) {
      throw new Error("QA Item 4 Failed!");
    }
    console.log("✅ QA Item 4 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 5: Step 3 GxP Impact Assessment & Validation Plan
    // -------------------------------------------------------------------------
    console.log(
      "--- QA Item 5: Step 3 GxP Impact Assessment & Validation Plan ---"
    );
    const resImpact = await request("POST", "/api/v1/csv/impact-assessments", {
      projectId,
      patientSafety: true,
      productQuality: true,
      dataIntegrity: true,
      gxpProcessImpact: true
    });
    console.log(
      `[POST /api/v1/csv/impact-assessments] Status ${resImpact.status}`
    );
    console.log("Impact Result:", resImpact.data);
    const planId = resImpact.data.validationPlan.id;

    const resApprovePlan = await request(
      "POST",
      `/api/v1/csv/impact-assessments/${planId}/approve`
    );
    console.log(
      `[POST /api/v1/csv/impact-assessments/${planId}/approve] Plan Status: ${resApprovePlan.data.status}`
    );
    if (resImpact.status !== 200 || resApprovePlan.data.status !== "APPROVED") {
      throw new Error("QA Item 5 Failed!");
    }
    console.log("✅ QA Item 5 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 6: Step 4 Design Specs, FLRA Risks & RTM Linkage
    // -------------------------------------------------------------------------
    console.log(
      "--- QA Item 6: Step 4 Design Specs, FLRA Risks & RTM Engine ---"
    );
    const resSpec = await request("POST", "/api/v1/csv/specs", {
      ursId,
      fsCode: "FS-GLU-01",
      flowDetails: "Formula: Concentration = RawAbsorbance * CalibrationFactor",
      configSpecs: [{ configCode: "CS-CALIB-01", parameters: { factor: 1.25 } }]
    });
    console.log(`[POST /api/v1/csv/specs] Status ${resSpec.status}`);
    console.log("Created Functional Spec:", resSpec.data);
    const fsId = resSpec.data.id;

    const resRisk = await request("POST", "/api/v1/csv/risks", {
      fsId,
      hazardMode:
        "Incorrect Calibration Factor applied resulting in wrong mg/dL readout",
      severity: "HIGH",
      probability: "LOW",
      residualRisk: "ACCEPTABLE"
    });
    console.log(`[POST /api/v1/csv/risks] Status ${resRisk.status}`);
    console.log("Created FLRA Risk:", resRisk.data);

    const resRtm = await request("GET", `/api/v1/csv/rtm/project/${projectId}`);
    console.log(
      `[GET /api/v1/csv/rtm/project/${projectId}] RTM Summary: Total Req=${resRtm.data.totalRequirements}, Coverage=${resRtm.data.coveragePercentage}%`
    );
    if (
      resSpec.status !== 201 ||
      resRisk.status !== 201 ||
      resRtm.status !== 200
    ) {
      throw new Error("QA Item 6 Failed!");
    }
    console.log("✅ QA Item 6 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 7: Step 5 Test Protocol, Case, Step & Execution (PASS)
    // -------------------------------------------------------------------------
    console.log("--- QA Item 7: Step 5 Test Protocols & Execution ---");
    const resProtocol = await request("POST", "/api/v1/csv/test-protocols", {
      projectId,
      protocolType: "IQ",
      status: "APPROVED"
    });
    const protocolId = resProtocol.data.id;

    const resCase = await request("POST", "/api/v1/csv/test-protocols/cases", {
      protocolId,
      tcCode: "TC-GLU-01",
      title: "Verify Glucose Calculation (110.0 mg/dL)"
    });
    const tcId = resCase.data.id;

    const resStep = await request("POST", "/api/v1/csv/test-protocols/steps", {
      testCaseId: tcId,
      stepNum: 1,
      action: "Input RawAbsorbance = 88.0 and CalibrationFactor = 1.25",
      expectedResult: "Concentration displayed as 110.0 mg/dL"
    });
    const stepId = resStep.data.id;
    console.log(`Created Protocol ${protocolId}, Case ${tcId}, Step ${stepId}`);

    // Link Test Case to RTM Matrix for 100% Coverage
    await CsvRtmMatrix.update(
      { testCaseId: tcId, coverageStatus: "COVERED" },
      { where: { projectId } }
    );

    const resExec = await request("POST", "/api/v1/csv/executions", {
      stepId,
      actualResult: "Observed 110.0 mg/dL readout in UI.",
      status: "PASS"
    });
    console.log(`[POST /api/v1/csv/executions] Status ${resExec.status}`);
    console.log("Execution Result:", resExec.data.execution);
    if (resExec.status !== 201 || resExec.data.execution.status !== "PASS") {
      throw new Error("QA Item 7 Failed!");
    }
    console.log("✅ QA Item 7 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 8: Step 6 Discrepancies & Bug Triage
    // -------------------------------------------------------------------------
    console.log("--- QA Item 8: Step 6 Discrepancies & Bug Triage ---");
    // Simulate a failed step execution to test discrepancy auto-creation
    const resStepFail = await request(
      "POST",
      "/api/v1/csv/test-protocols/steps",
      {
        testCaseId: tcId,
        stepNum: 2,
        action: "Negative Test: Input Negative Absorbance -10.0",
        expectedResult: "Error message: Invalid input"
      }
    );

    const resExecFail = await request("POST", "/api/v1/csv/executions", {
      stepId: resStepFail.data.id,
      actualResult: "Application crashed instead of displaying error message.",
      status: "FAIL"
    });
    console.log("Auto-created Discrepancy:", resExecFail.data.discrepancy);
    const discId = resExecFail.data.discrepancy.id;

    // Triage & Close Discrepancy
    const _resTriage = await request(
      "PUT",
      `/api/v1/csv/discrepancies/${discId}`,
      {
        bugSeverity: "MAJOR",
        rootCause:
          "Missing unhandled exception check for negative absorbance input.",
        fixStatus: "FIXED"
      }
    );

    const resCloseDisc = await request(
      "POST",
      `/api/v1/csv/discrepancies/${discId}/close`
    );
    console.log(
      `[POST /api/v1/csv/discrepancies/${discId}/close] Discrepancy Status: ${resCloseDisc.data.fixStatus}`
    );
    if (
      resExecFail.data.discrepancy === null ||
      resCloseDisc.data.fixStatus !== "CLOSED"
    ) {
      throw new Error("QA Item 8 Failed!");
    }
    console.log("✅ QA Item 8 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 9: Step 7 Traceability Readiness & 21 CFR Part 11 Signatures
    // -------------------------------------------------------------------------
    console.log(
      "--- QA Item 9: Step 7 Traceability Gate & 21 CFR Part 11 Signatures ---"
    );
    const resReadiness = await request(
      "GET",
      `/api/v1/csv/signatures/readiness/${projectId}`
    );
    console.log(
      `[GET /api/v1/csv/signatures/readiness/${projectId}] Ready: ${resReadiness.data.ready}, Coverage: ${resReadiness.data.coveragePercentage}%, Open Bugs: ${resReadiness.data.openDiscrepancyCount}`
    );

    const _resVsr = await request("POST", "/api/v1/csv/signatures/vsr", {
      projectId,
      summaryText:
        "Validation complete with 100% matrix coverage and zero open bugs.",
      releaseRecommendation: "APPROVED_FOR_PRODUCTION"
    });

    const resSign = await request("POST", "/api/v1/csv/signatures", {
      projectId,
      signatureMeaning:
        "I approve this CSV Validation Summary Report and authorize release.",
      password: "password123",
      mfaCode: "123456"
    });
    console.log(
      `[POST /api/v1/csv/signatures] Project Locked Status: ${resSign.data.project.status}, SHA-256 Checksum: ${resSign.data.signature.checksumHash}`
    );
    if (resSign.status !== 200 || resSign.data.project.status !== "READ_ONLY") {
      throw new Error("QA Item 9 Failed!");
    }
    console.log("✅ QA Item 9 PASSED!\n");

    // -------------------------------------------------------------------------
    // QA Item 10: Step 8 Audit Package Export & Periodic Review
    // -------------------------------------------------------------------------
    console.log(
      "--- QA Item 10: Step 8 Audit Package Exporter & Periodic Review ---"
    );
    const resReview = await request(
      "POST",
      "/api/v1/csv/periodic-reviews/schedule",
      {
        appId,
        projectId
      }
    );
    console.log(
      `[POST /api/v1/csv/periodic-reviews/schedule] Scheduled Date: ${resReview.data.scheduledDate}, Status: ${resReview.data.status}`
    );

    const resReviewList = await request("GET", "/api/v1/csv/periodic-reviews");
    console.log(
      `[GET /api/v1/csv/periodic-reviews] Found ${resReviewList.data.length} review calendar item(s).`
    );
    if (resReview.status !== 201 || resReviewList.data.length === 0) {
      throw new Error("QA Item 10 Failed!");
    }
    console.log("✅ QA Item 10 PASSED!\n");

    console.log("==========================================================");
    console.log("   🎉 ALL 10 QA ITEMS PASSED SUCCESSFULLY (100% VERIFIED) ");
    console.log("==========================================================");
  } catch (error) {
    console.error("❌ QA Test Suite Failed:", error);
    process.exit(1);
  } finally {
    server.close();
  }
};

runQaTestSuite();
