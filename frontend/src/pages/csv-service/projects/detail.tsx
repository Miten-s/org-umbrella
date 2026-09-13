import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProjectById,
  getRequirementsByProject,
  createRequirement,
  calculateImpactAssessment,
  approveValidationPlan,
  createFunctionalSpec,
  createFunctionalRisk,
  getRtmByProject,
  verifyRtmCoverage,
  createTestProtocol,
  createTestCase,
  createTestStep,
  getProtocolsByProject,
  executeTestStep,
  uploadExecutionEvidence,
  getDiscrepanciesByProject,
  triageDiscrepancy,
  closeDiscrepancy,
  getTraceabilityReadiness,
  createVsrReport,
  execute21CfrPart11Signature,
  exportAuditPackage,
  schedulePeriodicReview
} from "@/services/csv.service";
import {
  CsvProject,
  CsvUserRequirement,
  CsvImpactAssessmentResult,
  CsvRtmSummary,
  CsvTestProtocol,
  CsvDiscrepancy,
  CsvTraceabilityReadiness
} from "@/types/csv.types";
import { toast } from "@/lib/toast";

const CSVProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<CsvProject | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "urs"
    | "impact"
    | "specs"
    | "testing"
    | "discrepancies"
    | "signature"
    | "audit"
  >("urs");
  const [loading, setLoading] = useState<boolean>(true);

  // Tab 1: URS
  const [requirements, setRequirements] = useState<CsvUserRequirement[]>([]);
  const [ursCode, setUrsCode] = useState<string>("");
  const [ursTitle, setUrsTitle] = useState<string>("");
  const [ursDescription, setUrsDescription] = useState<string>("");
  const [ursGxpFlag, setUrsGxpFlag] = useState<boolean>(true);
  const [showUrsModal, setShowUrsModal] = useState<boolean>(false);

  // Tab 2: Impact Assessment
  const [patientSafety, setPatientSafety] = useState<boolean>(true);
  const [productQuality, setProductQuality] = useState<boolean>(true);
  const [dataIntegrity, setDataIntegrity] = useState<boolean>(true);
  const [impactResult, setImpactResult] =
    useState<CsvImpactAssessmentResult | null>(null);

  // Tab 3: Specs & Risks & RTM
  const [selectedUrsId, setSelectedUrsId] = useState<string>("");
  const [fsCode, setFsCode] = useState<string>("");
  const [flowDetails, setFlowDetails] = useState<string>("");
  const [showFsModal, setShowFsModal] = useState<boolean>(false);

  const [createdFsId, setCreatedFsId] = useState<string>("");
  const [hazardMode, setHazardMode] = useState<string>("");
  const [severity, setSeverity] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [probability, setProbability] = useState<"HIGH" | "MEDIUM" | "LOW">(
    "LOW"
  );
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);

  const [rtmSummary, setRtmSummary] = useState<CsvRtmSummary | null>(null);

  // Tab 4: Testing Desk
  const [protocols, setProtocols] = useState<CsvTestProtocol[]>([]);
  const [protocolType, setProtocolType] = useState<"IQ" | "OQ" | "UAT" | "PQ">(
    "IQ"
  );
  const [showProtocolModal, setShowProtocolModal] = useState<boolean>(false);

  const [selectedProtocolId, setSelectedProtocolId] = useState<string>("");
  const [tcCode, setTcCode] = useState<string>("");
  const [tcTitle, setTcTitle] = useState<string>("");
  const [showCaseModal, setShowCaseModal] = useState<boolean>(false);

  const [selectedTcId, setSelectedTcId] = useState<string>("");
  const [stepNum, setStepNum] = useState<number>(1);
  const [stepAction, setStepAction] = useState<string>("");
  const [stepExpected, setStepExpected] = useState<string>("");
  const [showStepModal, setShowStepModal] = useState<boolean>(false);

  const [execStepId, setExecStepId] = useState<string>("");
  const [execActual, setExecActual] = useState<string>("");
  const [execStatus, setExecStatus] = useState<"PASS" | "FAIL">("PASS");
  const [execEvidenceFile, setExecEvidenceFile] = useState<File | null>(null);
  const [showExecModal, setShowExecModal] = useState<boolean>(false);

  // Tab 5: Discrepancies
  const [discrepancies, setDiscrepancies] = useState<CsvDiscrepancy[]>([]);
  const [selectedDisc, setSelectedDisc] = useState<CsvDiscrepancy | null>(null);
  const [triageSeverity, setTriageSeverity] = useState<
    "CRITICAL" | "MAJOR" | "MINOR"
  >("MAJOR");
  const [triageCause, setTriageCause] = useState<string>("");
  const [triageFixStatus, setTriageFixStatus] = useState<
    "OPEN" | "IN_TRIAGE" | "FIXED" | "RE_TESTED" | "CLOSED"
  >("FIXED");
  const [showTriageModal, setShowTriageModal] = useState<boolean>(false);

  // Tab 6: Signatures
  const [readiness, setReadiness] = useState<CsvTraceabilityReadiness | null>(
    null
  );
  const [vsrSummary] = useState<string>(
    "Validation complete with 100% matrix coverage and zero open bugs."
  );
  const [releaseRec] = useState<string>("APPROVED_FOR_PRODUCTION");
  const [sigMeaning, setSigMeaning] = useState<string>(
    "I approve this CSV Validation Summary Report"
  );
  const [sigPassword, setSigPassword] = useState<string>("");
  const [sigMfa, setSigMfa] = useState<string>("");
  const [showSigModal, setShowSigModal] = useState<boolean>(false);

  // Tab 7: Audit
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const loadProjectData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const proj = await getProjectById(id);
      setProject(proj);
      const [reqs, rtm, protList, discList, readyData] = await Promise.all([
        getRequirementsByProject(id),
        getRtmByProject(id),
        getProtocolsByProject(id),
        getDiscrepanciesByProject(id),
        getTraceabilityReadiness(id)
      ]);
      setRequirements(reqs);
      setRtmSummary(rtm);
      setProtocols(protList);
      setDiscrepancies(discList);
      setReadiness(readyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  if (loading || !project) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
        Loading Validation Project details...
      </div>
    );
  }

  // --- Handlers ---
  const handleAddUrs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ursCode || !ursTitle) return;
    await createRequirement({
      projectId: id,
      ursCode,
      title: ursTitle,
      description: ursDescription,
      gxpFlag: ursGxpFlag
    });
    setShowUrsModal(false);
    setUrsCode("");
    setUrsTitle("");
    setUrsDescription("");
    loadProjectData();
  };

  const handleCalculateImpact = async () => {
    if (!id) return;
    const res = await calculateImpactAssessment({
      projectId: id,
      patientSafetyImpact: patientSafety,
      productQualityImpact: productQuality,
      dataIntegrityImpact: dataIntegrity
    });
    setImpactResult(res);
  };

  const handleApprovePlan = async () => {
    if (!impactResult?.validationPlan?.id) return;
    await approveValidationPlan(impactResult.validationPlan.id);
    loadProjectData();
  };

  const handleAddFs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUrsId || !fsCode) return;
    const fs = await createFunctionalSpec({
      ursId: selectedUrsId,
      fsCode,
      flowDetails
    });
    setCreatedFsId(fs.id);
    setShowFsModal(false);
    setFsCode("");
    setFlowDetails("");
    setShowRiskModal(true);
    loadProjectData();
  };

  const handleAddRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdFsId || !hazardMode) return;
    await createFunctionalRisk({
      fsId: createdFsId,
      hazardMode,
      severity,
      probability
    });
    setShowRiskModal(false);
    setHazardMode("");
    loadProjectData();
  };

  const handleAddProtocol = async () => {
    if (!id) return;
    await createTestProtocol({
      projectId: id,
      protocolType,
      status: "APPROVED"
    });
    setShowProtocolModal(false);
    loadProjectData();
  };

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocolId || !tcCode || !tcTitle) return;
    await createTestCase({
      protocolId: selectedProtocolId,
      tcCode,
      title: tcTitle
    });
    setShowCaseModal(false);
    setTcCode("");
    setTcTitle("");
    loadProjectData();
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTcId || !stepAction || !stepExpected) return;
    await createTestStep({
      testCaseId: selectedTcId,
      stepNum,
      action: stepAction,
      expectedResult: stepExpected
    });
    setShowStepModal(false);
    setStepAction("");
    setStepExpected("");
    loadProjectData();
  };

  const handleExecuteStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!execStepId || !execActual) return;
    const { execution } = await executeTestStep({
      stepId: execStepId,
      actualResult: execActual,
      status: execStatus
    });

    if (execEvidenceFile && execution?.id) {
      await uploadExecutionEvidence(execution.id, execEvidenceFile);
    }
    setShowExecModal(false);
    setExecActual("");
    setExecEvidenceFile(null);
    loadProjectData();
  };

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisc) return;
    await triageDiscrepancy(selectedDisc.id, {
      bugSeverity: triageSeverity,
      rootCause: triageCause,
      fixStatus: triageFixStatus
    });
    if (triageFixStatus === "CLOSED") {
      await closeDiscrepancy(selectedDisc.id);
    }
    setShowTriageModal(false);
    loadProjectData();
  };

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !sigPassword || !sigMfa) return;
    await createVsrReport({
      projectId: id,
      summaryText: vsrSummary,
      releaseRecommendation: releaseRec
    });
    await execute21CfrPart11Signature({
      projectId: id,
      signatureMeaning: sigMeaning,
      password: sigPassword,
      mfaCode: sigMfa
    });
    setShowSigModal(false);
    setSigPassword("");
    setSigMfa("");
    loadProjectData();
  };

  const handleDownloadZip = async () => {
    if (!id) return;
    const blob = await exportAuditPackage(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CSV_Audit_Package_${project.gxpChangeControlId || id}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleScheduleReview = async () => {
    if (!id || !project.appId) return;
    await schedulePeriodicReview({
      appId: project.appId,
      projectId: id,
      scheduledDate: scheduledDate || undefined
    });
    toast("1-Year Periodic Review scheduled", "success");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <Link to="/csv-service/projects" className="hover:underline">
              &larr; CSV Projects
            </Link>{" "}
            / {project.gxpChangeControlId || project.id}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.projectTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Application: {project.application?.name || project.appId} | Phase:{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {project.currentPhase}
            </span>{" "}
            | Status:{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {project.status}
            </span>
          </p>
        </div>

        {project.status === "READ_ONLY" && (
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
            🔒 21 CFR Part 11 Locked & Validated
          </div>
        )}
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto space-x-6">
        {[
          { key: "urs", label: "Step 2: URS" },
          { key: "impact", label: "Step 3: GxP Impact & Plan" },
          { key: "specs", label: "Step 4: Specs, Risks & RTM" },
          { key: "testing", label: "Step 5: Testing Desk" },
          { key: "discrepancies", label: "Step 6: Discrepancies" },
          { key: "signature", label: "Step 7: Part 11 E-Sign" },
          { key: "audit", label: "Step 8: Audit & Maintenance" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* STEP 2: URS */}
        {activeTab === "urs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                User Requirement Specifications (URS)
              </h3>
              <button
                onClick={() => setShowUrsModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                + Add URS Requirement
              </button>
            </div>

            {requirements.length === 0 ? (
              <p className="text-sm text-gray-500 py-6">
                No user requirements recorded yet. Click "+ Add URS
                Requirement".
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-3">URS Code</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">GxP Relevance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {requirements.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-mono font-semibold text-blue-600">
                        {r.ursCode}
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        {r.title}
                      </td>
                      <td className="p-3 text-gray-500">
                        {r.description || "N/A"}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          {r.gxpFlag ? "GxP Relevant" : "Non-GxP"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* STEP 3: GXP IMPACT */}
        {activeTab === "impact" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              GxP Impact Assessment Questionnaire & Validation Plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patientSafety}
                  onChange={(e) => setPatientSafety(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Patient Safety Impact
                </span>
              </label>

              <label className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productQuality}
                  onChange={(e) => setProductQuality(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Product Quality Impact
                </span>
              </label>

              <label className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dataIntegrity}
                  onChange={(e) => setDataIntegrity(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Data Integrity Impact
                </span>
              </label>
            </div>

            <button
              onClick={handleCalculateImpact}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Evaluate Impact & Generate Plan
            </button>

            {impactResult && (
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">
                      Calculated GxP Impact Level:
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      {impactResult.gxpImpactLevel}
                    </div>
                  </div>

                  <button
                    onClick={handleApprovePlan}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                  >
                    Approve Validation Plan &rarr;
                  </button>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Required Qualification Deliverables:
                  </div>
                  <div className="flex gap-2">
                    {impactResult.deliverables.map((d) => (
                      <span
                        key={d}
                        className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SPECS & RISKS & RTM */}
        {activeTab === "specs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Design Specs, FLRA Risks & RTM Matrix
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFsModal(true)}
                  className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  + Add Functional Spec (FS)
                </button>

                <button
                  onClick={async () => {
                    if (id) {
                      const summary = await verifyRtmCoverage(id);
                      setRtmSummary(summary);
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  🔄 Recalculate RTM Matrix
                </button>
              </div>
            </div>

            {/* RTM Coverage Progress */}
            {rtmSummary && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 space-y-2">
                <div className="flex justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                  <span>Requirement Traceability Matrix Coverage</span>
                  <span>{rtmSummary.coveragePercentage}% Covered</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 transition-all duration-500"
                    style={{ width: `${rtmSummary.coveragePercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* RTM Matrix Table */}
            {rtmSummary && rtmSummary.matrix.length > 0 && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-3">URS Code</th>
                    <th className="p-3">FS Spec</th>
                    <th className="p-3">FLRA Risk</th>
                    <th className="p-3">Coverage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rtmSummary.matrix.map((row) => (
                    <tr key={row.id}>
                      <td className="p-3 font-mono font-bold text-blue-600">
                        {row.userRequirement?.ursCode || row.ursId}
                      </td>
                      <td className="p-3 text-gray-600">
                        {row.functionalSpec?.fsCode || "Unlinked"}
                      </td>
                      <td className="p-3 text-gray-600">
                        {row.functionalRisk?.hazardMode || "Unlinked"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            row.coverageStatus === "COVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.coverageStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* STEP 5: TESTING DESK */}
        {activeTab === "testing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Qualification Test Protocols & Execution Desk
              </h3>
              <button
                onClick={() => setShowProtocolModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                + Create Protocol (IQ/OQ/UAT)
              </button>
            </div>

            {protocols.length === 0 ? (
              <p className="text-sm text-gray-500 py-6">
                No qualification test protocols created yet.
              </p>
            ) : (
              <div className="space-y-4">
                {protocols.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">
                          Protocol: {p.protocolType}
                        </span>
                        <span className="text-xs text-gray-500">
                          Status: {p.status}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProtocolId(p.id);
                          setShowCaseModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200"
                      >
                        + Add Test Case
                      </button>
                    </div>

                    {/* Test Cases List */}
                    {p.testCases &&
                      p.testCases.map((tc) => (
                        <div
                          key={tc.id}
                          className="ml-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-100 dark:border-gray-700 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {tc.tcCode}: {tc.title}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTcId(tc.id);
                                setShowStepModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 rounded"
                            >
                              + Add Test Step
                            </button>
                          </div>

                          {/* Test Steps */}
                          {tc.testSteps && (
                            <div className="space-y-2">
                              {tc.testSteps.map((st) => (
                                <div
                                  key={st.id}
                                  className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-blue-600 mr-2">
                                      Step {st.stepNum}:
                                    </span>
                                    <span className="text-gray-800 dark:text-gray-200">
                                      {st.action}
                                    </span>
                                    <div className="text-gray-500 mt-0.5">
                                      Expected: {st.expectedResult}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setExecStepId(st.id);
                                      setShowExecModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-sm"
                                  >
                                    ▶ Execute Step
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: DISCREPANCIES */}
        {activeTab === "discrepancies" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Discrepancy & Bug Triage Workflow
            </h3>

            {discrepancies.length === 0 ? (
              <p className="text-sm text-gray-500 py-6">
                No open or closed discrepancies logged for this project.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="p-3">Discrepancy Code</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Root Cause</th>
                    <th className="p-3">Fix Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {discrepancies.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-mono font-bold text-red-600">
                        {d.discCode}
                      </td>
                      <td className="p-3 font-semibold text-xs text-amber-600">
                        {d.bugSeverity}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {d.rootCause || "Under Investigation"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                            d.fixStatus === "CLOSED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {d.fixStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedDisc(d);
                            setTriageSeverity(d.bugSeverity);
                            setTriageCause(d.rootCause || "");
                            setTriageFixStatus(d.fixStatus);
                            setShowTriageModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                        >
                          Triage & Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* STEP 7: PART 11 E-SIGNATURE */}
        {activeTab === "signature" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              21 CFR Part 11 Electronic Signature Gate
            </h3>

            {readiness && (
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">
                      Traceability Gate Status:
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        readiness.ready ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {readiness.ready ? "READY FOR QA SIGN-OFF" : "NOT READY"}
                    </div>
                  </div>

                  <button
                    disabled={
                      !readiness.ready || project.status === "READ_ONLY"
                    }
                    onClick={() => setShowSigModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"
                  >
                    ✍️ Execute 21 CFR Part 11 QA Sign-Off
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Total URS Reqs:</span>{" "}
                    <span className="font-bold">
                      {readiness.totalRequirements}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Covered Reqs:</span>{" "}
                    <span className="font-bold">
                      {readiness.coveredRequirements}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Coverage:</span>{" "}
                    <span className="font-bold">
                      {readiness.coveragePercentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Open Discrepancies:</span>{" "}
                    <span className="font-bold text-red-600">
                      {readiness.openDiscrepancyCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: AUDIT & MAINTENANCE */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Audit Package ZIP Export & Periodic Review Maintenance
            </h3>

            <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                1-Click Inspection ZIP Package Exporter
              </h4>
              <p className="text-xs text-gray-500">
                Downloads full ZIP archive containing all 20 JSON metadata
                snapshots, evidence screenshots, and backend SHA-256 checksum
                manifest.
              </p>
              <button
                onClick={handleDownloadZip}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                📦 Export Full Audit Package (.zip)
              </button>
            </div>

            <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Schedule 1-Year Periodic Review Calendar
              </h4>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
                <button
                  onClick={handleScheduleReview}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
                >
                  Schedule Periodic Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Modal: URS */}
      {showUrsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add User Requirement Specification (URS)
            </h3>
            <form onSubmit={handleAddUrs} className="space-y-4">
              <input
                type="text"
                placeholder="URS Code (e.g. URS-GLU-01)"
                value={ursCode}
                onChange={(e) => setUrsCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />
              <input
                type="text"
                placeholder="Title"
                value={ursTitle}
                onChange={(e) => setUrsTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={ursDescription}
                onChange={(e) => setUrsDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={ursGxpFlag}
                  onChange={(e) => setUrsGxpFlag(e.target.checked)}
                />
                GxP Relevant Requirement
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUrsModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg"
                >
                  Save URS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: FS */}
      {showFsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Functional Spec & Link FLRA Risk
            </h3>
            <form onSubmit={handleAddFs} className="space-y-4">
              <select
                value={selectedUrsId}
                onChange={(e) => setSelectedUrsId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              >
                <option value="" disabled>
                  -- Select URS Requirement --
                </option>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.ursCode}: {r.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="FS Code (e.g. FS-GLU-01)"
                value={fsCode}
                onChange={(e) => setFsCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <textarea
                placeholder="Flow & Formula Details"
                value={flowDetails}
                onChange={(e) => setFlowDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFsModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg"
                >
                  Create FS & Risk &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Risk */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add FLRA Risk Assessment
            </h3>
            <form onSubmit={handleAddRisk} className="space-y-4">
              <input
                type="text"
                placeholder="Hazard Mode (e.g. Incorrect calculation)"
                value={hazardMode}
                onChange={(e) => setHazardMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Probability
                </label>
                <select
                  value={probability}
                  onChange={(e) => setProbability(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRiskModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg"
                >
                  Save FLRA Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Test Protocol */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Qualification Test Protocol
            </h3>
            <div className="space-y-4">
              <select
                value={protocolType}
                onChange={(e) => setProtocolType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="IQ">IQ (Installation Qualification)</option>
                <option value="OQ">OQ (Operational Qualification)</option>
                <option value="UAT">UAT (User Acceptance Testing)</option>
                <option value="PQ">PQ (Performance Qualification)</option>
              </select>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProtocolModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProtocol}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg"
                >
                  Create Protocol
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Test Case */}
      {showCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Test Case
            </h3>
            <form onSubmit={handleAddCase} className="space-y-4">
              <input
                type="text"
                placeholder="Test Case Code (e.g. TC-GLU-01)"
                value={tcCode}
                onChange={(e) => setTcCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <input
                type="text"
                placeholder="Title"
                value={tcTitle}
                onChange={(e) => setTcTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Test Step */}
      {showStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Test Step
            </h3>
            <form onSubmit={handleAddStep} className="space-y-4">
              <input
                type="number"
                placeholder="Step Number"
                value={stepNum}
                onChange={(e) => setStepNum(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <textarea
                placeholder="Action"
                value={stepAction}
                onChange={(e) => setStepAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <textarea
                placeholder="Expected Result"
                value={stepExpected}
                onChange={(e) => setStepExpected(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStepModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg"
                >
                  Save Test Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Triage Discrepancy */}
      {showTriageModal && selectedDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Triage Discrepancy ({selectedDisc.discCode})
            </h3>
            <form onSubmit={handleTriage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bug Severity
                </label>
                <select
                  value={triageSeverity}
                  onChange={(e) => setTriageSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="MAJOR">MAJOR</option>
                  <option value="MINOR">MINOR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Root Cause
                </label>
                <textarea
                  value={triageCause}
                  onChange={(e) => setTriageCause(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Root cause explanation..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Fix Status
                </label>
                <select
                  value={triageFixStatus}
                  onChange={(e) => setTriageFixStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_TRIAGE">IN_TRIAGE</option>
                  <option value="FIXED">FIXED</option>
                  <option value="RE_TESTED">RE_TESTED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTriageModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg"
                >
                  Update & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Step Execution */}
      {showExecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Execute Test Step
            </h3>
            <form onSubmit={handleExecuteStep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={execStatus}
                  onChange={(e) => setExecStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL (Triggers Discrepancy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Actual Result
                </label>
                <textarea
                  value={execActual}
                  onChange={(e) => setExecActual(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Observed readout in UI..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Upload Screenshot Evidence (SHA-256 Hashed)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setExecEvidenceFile(
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                  className="w-full text-xs text-gray-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExecModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg"
                >
                  Submit Execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: 21 CFR Part 11 E-Signature */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              21 CFR Part 11 Electronic Signature Re-Authentication
            </h3>
            <form onSubmit={handleSignOff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Signature Meaning
                </label>
                <input
                  type="text"
                  value={sigMeaning}
                  onChange={(e) => setSigMeaning(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Re-enter Password
                </label>
                <input
                  type="password"
                  value={sigPassword}
                  onChange={(e) => setSigPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  MFA Code (6 Digits)
                </label>
                <input
                  type="text"
                  value={sigMfa}
                  onChange={(e) => setSigMfa(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm font-mono"
                  placeholder="123456"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSigModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold"
                >
                  Confirm Sign & Lock Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVProjectDetailPage;
