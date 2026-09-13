import axios from "axios";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/utils/error.utils";
import { AUTH_TOKEN_KEY } from "@/utils/common.constants";
import {
  CsvApplication,
  CsvProject,
  CsvUserRequirement,
  CsvImpactAssessmentResult,
  CsvValidationPlan,
  CsvFunctionalSpec,
  CsvFunctionalRisk,
  CsvRtmSummary,
  CsvTestProtocol,
  CsvTestCase,
  CsvTestStep,
  CsvTestExecution,
  CsvEvidence,
  CsvDiscrepancy,
  CsvTraceabilityReadiness,
  CsvVsrReport,
  CsvSignature,
  CsvPeriodicReview
} from "@/types/csv.types";

export const CSV_BASE_URL =
  import.meta.env.VITE_CSV_API_BASE_URL ?? "http://localhost:9003/api/v1/csv";

const csvApi = axios.create({
  baseURL: CSV_BASE_URL
});

csvApi.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(AUTH_TOKEN_KEY) ??
    localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

csvApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.code !== "ERR_CANCELED" &&
      error.name !== "CanceledError" &&
      error.response?.status !== 404
    ) {
      toast(getErrorMessage(error), "error");
    }
    return Promise.reject(error);
  }
);

// #region Health
export const getCsvHealth = async () => {
  const res = await csvApi.get("/health");
  return res.data;
};
// #endregion

// #region Applications
export const getApplications = async (): Promise<CsvApplication[]> => {
  const res = await csvApi.get("/applications");
  return res.data;
};

export const createApplication = async (payload: {
  appCode: string;
  name: string;
  gxpClassification?: string;
}): Promise<CsvApplication> => {
  const res = await csvApi.post("/applications", payload);
  toast("Application registered successfully", "success");
  return res.data;
};
// #endregion

// #region Projects
export const getProjects = async (): Promise<CsvProject[]> => {
  const res = await csvApi.get("/projects");
  return res.data;
};

export const getProjectById = async (id: string): Promise<CsvProject> => {
  const res = await csvApi.get(`/projects/${id}`);
  return res.data;
};

export const getProjectStatus = async (
  id: string
): Promise<{ id: string; currentPhase: string; status: string }> => {
  const res = await csvApi.get(`/projects/${id}/status`);
  return res.data;
};

export const createProject = async (payload: {
  appId: string;
  gxpChangeControlId?: string;
  projectTitle: string;
}): Promise<CsvProject> => {
  const res = await csvApi.post("/projects", payload);
  toast("Validation project created", "success");
  return res.data;
};

export const exportAuditPackage = async (projectId: string): Promise<Blob> => {
  const res = await csvApi.get(`/projects/${projectId}/export-audit`, {
    responseType: "blob"
  });
  return res.data;
};
// #endregion

// #region Requirements (URS)
export const getRequirementsByProject = async (
  projectId: string
): Promise<CsvUserRequirement[]> => {
  const res = await csvApi.get(`/requirements/project/${projectId}`);
  return res.data;
};

export const createRequirement = async (payload: {
  projectId: string;
  ursCode: string;
  title: string;
  description?: string;
  gxpFlag?: boolean;
}): Promise<CsvUserRequirement> => {
  const res = await csvApi.post("/requirements", payload);
  toast("User requirement created & seeded into RTM", "success");
  return res.data;
};
// #endregion

// #region Impact Assessment & Validation Plan
export const calculateImpactAssessment = async (payload: {
  projectId: string;
  patientSafetyImpact?: boolean;
  productQualityImpact?: boolean;
  dataIntegrityImpact?: boolean;
}): Promise<CsvImpactAssessmentResult> => {
  const res = await csvApi.post("/impact-assessments", payload);
  toast("GxP Impact evaluated", "success");
  return res.data;
};

export const approveValidationPlan = async (
  planId: string
): Promise<CsvValidationPlan> => {
  const res = await csvApi.post(`/impact-assessments/${planId}/approve`);
  toast("Validation Plan approved", "success");
  return res.data;
};
// #endregion

// #region Functional Specifications & Risks
export const createFunctionalSpec = async (payload: {
  ursId: string;
  fsCode: string;
  flowDetails?: string;
}): Promise<CsvFunctionalSpec> => {
  const res = await csvApi.post("/specs", payload);
  toast("Functional specification created", "success");
  return res.data;
};

export const getSpecsByUrs = async (
  ursId: string
): Promise<CsvFunctionalSpec[]> => {
  const res = await csvApi.get(`/specs/requirement/${ursId}`);
  return res.data;
};

export const createFunctionalRisk = async (payload: {
  fsId: string;
  hazardMode: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  probability: "HIGH" | "MEDIUM" | "LOW";
}): Promise<CsvFunctionalRisk> => {
  const res = await csvApi.post("/risks", payload);
  toast("FLRA Risk assessment recorded", "success");
  return res.data;
};

export const getRisksByFs = async (
  fsId: string
): Promise<CsvFunctionalRisk[]> => {
  const res = await csvApi.get(`/risks/spec/${fsId}`);
  return res.data;
};
// #endregion

// #region Requirement Traceability Matrix (RTM)
export const getRtmByProject = async (
  projectId: string
): Promise<CsvRtmSummary> => {
  const res = await csvApi.get(`/rtm/project/${projectId}`);
  return res.data;
};

export const verifyRtmCoverage = async (
  projectId: string
): Promise<CsvRtmSummary> => {
  const res = await csvApi.post(`/rtm/verify/${projectId}`);
  toast("RTM Matrix recalculated", "success");
  return res.data;
};
// #endregion

// #region Test Protocols, Cases, Steps & Executions
export const createTestProtocol = async (payload: {
  projectId: string;
  protocolType: "IQ" | "OQ" | "UAT" | "PQ" | "VSR";
  status?: string;
}): Promise<CsvTestProtocol> => {
  const res = await csvApi.post("/test-protocols", payload);
  toast("Test protocol created", "success");
  return res.data;
};

export const createTestCase = async (payload: {
  protocolId: string;
  tcCode: string;
  title: string;
}): Promise<CsvTestCase> => {
  const res = await csvApi.post("/test-protocols/cases", payload);
  toast("Test case created", "success");
  return res.data;
};

export const createTestStep = async (payload: {
  testCaseId: string;
  stepNum: number;
  action: string;
  expectedResult: string;
}): Promise<CsvTestStep> => {
  const res = await csvApi.post("/test-protocols/steps", payload);
  toast("Test step created", "success");
  return res.data;
};

export const getProtocolsByProject = async (
  projectId: string
): Promise<CsvTestProtocol[]> => {
  const res = await csvApi.get(`/test-protocols/project/${projectId}`);
  return res.data;
};

export const executeTestStep = async (payload: {
  stepId: string;
  actualResult: string;
  status: "PASS" | "FAIL";
}): Promise<{
  execution: CsvTestExecution;
  discrepancy: CsvDiscrepancy | null;
}> => {
  const res = await csvApi.post("/executions", payload);
  toast(
    payload.status === "PASS"
      ? "Test step PASSED"
      : "Test step FAILED - Discrepancy logged",
    payload.status === "PASS" ? "success" : "info"
  );
  return res.data;
};

export const uploadExecutionEvidence = async (
  executionId: string,
  file: File
): Promise<CsvEvidence> => {
  const formData = new FormData();
  formData.append("evidence", file);
  const res = await csvApi.post(
    `/executions/${executionId}/upload-evidence`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
  toast("Evidence uploaded & SHA-256 computed", "success");
  return res.data;
};
// #endregion

// #region Discrepancies
export const getDiscrepanciesByProject = async (
  projectId: string
): Promise<CsvDiscrepancy[]> => {
  const res = await csvApi.get(`/discrepancies/project/${projectId}`);
  return res.data;
};

export const triageDiscrepancy = async (
  id: string,
  payload: {
    bugSeverity?: "CRITICAL" | "MAJOR" | "MINOR";
    rootCause?: string;
    fixStatus?: "OPEN" | "IN_TRIAGE" | "FIXED" | "RE_TESTED" | "CLOSED";
  }
): Promise<CsvDiscrepancy> => {
  const res = await csvApi.put(`/discrepancies/${id}`, payload);
  toast("Discrepancy triaged", "success");
  return res.data;
};

export const closeDiscrepancy = async (id: string): Promise<CsvDiscrepancy> => {
  const res = await csvApi.post(`/discrepancies/${id}/close`);
  toast("Discrepancy closed", "success");
  return res.data;
};
// #endregion

// #region Signatures & VSR
export const getTraceabilityReadiness = async (
  projectId: string
): Promise<CsvTraceabilityReadiness> => {
  const res = await csvApi.get(`/signatures/readiness/${projectId}`);
  return res.data;
};

export const createVsrReport = async (payload: {
  projectId: string;
  summaryText: string;
  releaseRecommendation: string;
}): Promise<CsvVsrReport> => {
  const res = await csvApi.post("/signatures/vsr", payload);
  toast("VSR Report created", "success");
  return res.data;
};

export const execute21CfrPart11Signature = async (payload: {
  projectId: string;
  signatureMeaning: string;
  password: string;
  mfaCode: string;
}): Promise<{ signature: CsvSignature; project: CsvProject }> => {
  const res = await csvApi.post("/signatures", payload);
  toast("21 CFR Part 11 Signature executed & project locked", "success");
  return res.data;
};
// #endregion

// #region Periodic Reviews
export const schedulePeriodicReview = async (payload: {
  appId: string;
  projectId: string;
  scheduledDate?: string;
}): Promise<CsvPeriodicReview> => {
  const res = await csvApi.post("/periodic-reviews/schedule", payload);
  toast("1-Year Periodic Review scheduled", "success");
  return res.data;
};

export const getPeriodicReviews = async (): Promise<CsvPeriodicReview[]> => {
  const res = await csvApi.get("/periodic-reviews");
  return res.data;
};
// #endregion

export default csvApi;
