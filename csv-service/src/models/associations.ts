import CsvApplication from "./csv-application.model";
import CsvProject from "./csv-project.model";
import CsvUserRequirement from "./csv-user-requirement.model";
import CsvValidationPlan from "./csv-validation-plan.model";
import CsvFunctionalSpec from "./csv-functional-spec.model";
import CsvConfigSpec from "./csv-config-spec.model";
import CsvFunctionalRisk from "./csv-functional-risk.model";
import CsvRtmMatrix from "./csv-rtm-matrix.model";
import CsvTestProtocol from "./csv-test-protocol.model";
import CsvSopReference from "./csv-sop-reference.model";
import CsvTestCase from "./csv-test-case.model";
import CsvTestStep from "./csv-test-step.model";
import CsvTestExecution from "./csv-test-execution.model";
import CsvEvidence from "./csv-evidence.model";
import CsvDiscrepancy from "./csv-discrepancy.model";
import CsvVsrReport from "./csv-vsr-report.model";
import CsvPeriodicReview from "./csv-periodic-review.model";

export function registerAssociations() {
  // Application -> Projects & Reviews
  CsvApplication.hasMany(CsvProject, { foreignKey: "appId", as: "projects" });
  CsvProject.belongsTo(CsvApplication, {
    foreignKey: "appId",
    as: "application"
  });

  CsvApplication.hasMany(CsvPeriodicReview, {
    foreignKey: "appId",
    as: "periodicReviews"
  });
  CsvPeriodicReview.belongsTo(CsvApplication, {
    foreignKey: "appId",
    as: "application"
  });

  CsvProject.hasMany(CsvPeriodicReview, {
    foreignKey: "projectId",
    as: "periodicReviews"
  });
  CsvPeriodicReview.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  // Project -> Deliverables & Requirements
  CsvProject.hasMany(CsvUserRequirement, {
    foreignKey: "projectId",
    as: "userRequirements"
  });
  CsvUserRequirement.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  CsvProject.hasOne(CsvValidationPlan, {
    foreignKey: "projectId",
    as: "validationPlan"
  });
  CsvValidationPlan.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  CsvProject.hasMany(CsvTestProtocol, {
    foreignKey: "projectId",
    as: "testProtocols"
  });
  CsvTestProtocol.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  CsvProject.hasMany(CsvSopReference, {
    foreignKey: "projectId",
    as: "sopReferences"
  });
  CsvSopReference.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  CsvProject.hasOne(CsvVsrReport, { foreignKey: "projectId", as: "vsrReport" });
  CsvVsrReport.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  CsvProject.hasMany(CsvRtmMatrix, {
    foreignKey: "projectId",
    as: "rtmEntries"
  });
  CsvRtmMatrix.belongsTo(CsvProject, {
    foreignKey: "projectId",
    as: "project"
  });

  // Requirement -> Functional Specs
  CsvUserRequirement.hasMany(CsvFunctionalSpec, {
    foreignKey: "ursId",
    as: "functionalSpecs"
  });
  CsvFunctionalSpec.belongsTo(CsvUserRequirement, {
    foreignKey: "ursId",
    as: "userRequirement"
  });

  // Functional Spec -> Config Specs & Risks
  CsvFunctionalSpec.hasMany(CsvConfigSpec, {
    foreignKey: "fsId",
    as: "configSpecs"
  });
  CsvConfigSpec.belongsTo(CsvFunctionalSpec, {
    foreignKey: "fsId",
    as: "functionalSpec"
  });

  CsvFunctionalSpec.hasMany(CsvFunctionalRisk, {
    foreignKey: "fsId",
    as: "functionalRisks"
  });
  CsvFunctionalRisk.belongsTo(CsvFunctionalSpec, {
    foreignKey: "fsId",
    as: "functionalSpec"
  });

  // Protocols -> Test Cases -> Test Steps -> Test Executions
  CsvTestProtocol.hasMany(CsvTestCase, {
    foreignKey: "protocolId",
    as: "testCases"
  });
  CsvTestCase.belongsTo(CsvTestProtocol, {
    foreignKey: "protocolId",
    as: "testProtocol"
  });

  CsvTestCase.hasMany(CsvTestStep, {
    foreignKey: "testCaseId",
    as: "testSteps"
  });
  CsvTestStep.belongsTo(CsvTestCase, {
    foreignKey: "testCaseId",
    as: "testCase"
  });

  CsvTestStep.hasMany(CsvTestExecution, {
    foreignKey: "stepId",
    as: "executions"
  });
  CsvTestExecution.belongsTo(CsvTestStep, {
    foreignKey: "stepId",
    as: "testStep"
  });

  // Executions -> Evidence & Discrepancies
  CsvTestExecution.hasMany(CsvEvidence, {
    foreignKey: "executionId",
    as: "evidences"
  });
  CsvEvidence.belongsTo(CsvTestExecution, {
    foreignKey: "executionId",
    as: "execution"
  });

  CsvTestExecution.hasMany(CsvDiscrepancy, {
    foreignKey: "executionId",
    as: "discrepancies"
  });
  CsvDiscrepancy.belongsTo(CsvTestExecution, {
    foreignKey: "executionId",
    as: "execution"
  });

  // RTM Links
  CsvRtmMatrix.belongsTo(CsvUserRequirement, {
    foreignKey: "ursId",
    as: "userRequirement"
  });
  CsvRtmMatrix.belongsTo(CsvFunctionalSpec, {
    foreignKey: "fsId",
    as: "functionalSpec"
  });
  CsvRtmMatrix.belongsTo(CsvFunctionalRisk, {
    foreignKey: "riskId",
    as: "functionalRisk"
  });
  CsvRtmMatrix.belongsTo(CsvTestCase, {
    foreignKey: "testCaseId",
    as: "testCase"
  });
}
