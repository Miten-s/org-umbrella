export interface CsvApplication {
  id: string;
  appCode: string;
  name: string;
  gxpClassification: string;
  createdAt: string;
  updatedAt: string;
}

export interface CsvProject {
  id: string;
  appId: string;
  gxpChangeControlId: string | null;
  projectTitle: string;
  currentPhase:
    "INTAKE" | "DESIGN_SPEC" | "TEST_EXECUTION" | "VALIDATED" | "READ_ONLY";
  status: "INTAKE" | "DRAFT" | "IN_PROGRESS" | "APPROVED" | "READ_ONLY";
  application?: CsvApplication;
  createdAt: string;
  updatedAt: string;
}

export interface CsvUserRequirement {
  id: string;
  projectId: string;
  ursCode: string;
  title: string;
  description: string | null;
  gxpFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CsvValidationPlan {
  id: string;
  projectId: string;
  deliverables: string[];
  status: "DRAFT" | "APPROVED";
  createdAt: string;
  updatedAt: string;
}

export interface CsvImpactAssessmentResult {
  projectId: string;
  gxpImpactLevel: "HIGH" | "MEDIUM" | "LOW";
  deliverables: string[];
  validationPlan: CsvValidationPlan;
}

export interface CsvFunctionalSpec {
  id: string;
  ursId: string;
  fsCode: string;
  flowDetails: string | null;
  userRequirement?: CsvUserRequirement;
  createdAt: string;
  updatedAt: string;
}

export interface CsvConfigSpec {
  id: string;
  fsId: string;
  configCode: string;
  parameters: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CsvFunctionalRisk {
  id: string;
  fsId: string;
  hazardMode: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  probability: "HIGH" | "MEDIUM" | "LOW";
  residualRisk: "ACCEPTABLE" | "UNACCEPTABLE";
  functionalSpec?: CsvFunctionalSpec;
  createdAt: string;
  updatedAt: string;
}

export interface CsvRtmMatrix {
  id: string;
  projectId: string;
  ursId: string;
  fsId: string | null;
  riskId: string | null;
  testCaseId: string | null;
  coverageStatus: "UNCOVERED" | "COVERED";
  userRequirement?: CsvUserRequirement;
  functionalSpec?: CsvFunctionalSpec;
  functionalRisk?: CsvFunctionalRisk;
  testCase?: CsvTestCase;
  createdAt: string;
  updatedAt: string;
}

export interface CsvRtmSummary {
  projectId: string;
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
  matrix: CsvRtmMatrix[];
}

export interface CsvTestProtocol {
  id: string;
  projectId: string;
  protocolType: "IQ" | "OQ" | "UAT" | "PQ" | "VSR";
  status: "DRAFT" | "APPROVED";
  testCases?: CsvTestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface CsvTestCase {
  id: string;
  protocolId: string;
  tcCode: string;
  title: string;
  testSteps?: CsvTestStep[];
  createdAt: string;
  updatedAt: string;
}

export interface CsvTestStep {
  id: string;
  testCaseId: string;
  stepNum: number;
  action: string;
  expectedResult: string;
  executions?: CsvTestExecution[];
  createdAt: string;
  updatedAt: string;
}

export interface CsvEvidence {
  id: string;
  executionId: string;
  filePath: string;
  sha256Hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CsvTestExecution {
  id: string;
  stepId: string;
  actualResult: string;
  status: "PASS" | "FAIL" | "NOT_RUN";
  executedBy: string;
  executedAt: string;
  evidences?: CsvEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface CsvDiscrepancy {
  id: string;
  executionId: string;
  discCode: string;
  bugSeverity: "CRITICAL" | "MAJOR" | "MINOR";
  rootCause: string | null;
  fixStatus: "OPEN" | "IN_TRIAGE" | "FIXED" | "RE_TESTED" | "CLOSED";
  execution?: CsvTestExecution;
  createdAt: string;
  updatedAt: string;
}

export interface CsvVsrReport {
  id: string;
  projectId: string;
  summaryText: string;
  releaseRecommendation: string;
  status: "DRAFT" | "APPROVED";
  createdAt: string;
  updatedAt: string;
}

export interface CsvSignature {
  id: string;
  entityType: string;
  entityId: string;
  signerId: string;
  signatureMeaning: string;
  signedAt: string;
  checksumHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CsvTraceabilityReadiness {
  projectId: string;
  ready: boolean;
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercentage: number;
  openDiscrepancyCount: number;
}

export interface CsvPeriodicReview {
  id: string;
  appId: string;
  projectId: string;
  scheduledDate: string;
  status: "SCHEDULED" | "COMPLETED" | "OVERDUE";
  reviewerId: string | null;
  project?: CsvProject;
  application?: CsvApplication;
  createdAt: string;
  updatedAt: string;
}
