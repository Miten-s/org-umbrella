import CsvProject from "../models/csv-project.model";
import CsvValidationPlan from "../models/csv-validation-plan.model";
import { writeAudit, AuditActor } from "../utils/audit.util";

export interface ImpactAssessmentInput {
  projectId: string;
  patientSafety: boolean;
  productQuality: boolean;
  dataIntegrity: boolean;
  gxpProcessImpact?: boolean;
  questionnaireAnswers?: Record<string, any>;
}

export interface ImpactAssessmentResult {
  projectId: string;
  gxpImpactLevel: "HIGH" | "MEDIUM" | "LOW";
  deliverables: string[];
  validationPlan: CsvValidationPlan;
}

export const evaluateImpactAssessment = async (
  input: ImpactAssessmentInput,
  actor: AuditActor
): Promise<ImpactAssessmentResult> => {
  const {
    projectId,
    patientSafety,
    productQuality,
    dataIntegrity,
    gxpProcessImpact = true
  } = input;

  const project = await CsvProject.findByPk(projectId);
  if (!project) {
    throw {
      statusCode: 404,
      message: `Project with ID ${projectId} not found.`
    };
  }

  // GxP Impact Rules Engine Logic (PDF 185215 Step 3)
  let gxpImpactLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let deliverables: string[] = ["VSR"];

  if (patientSafety || productQuality) {
    gxpImpactLevel = "HIGH";
    deliverables = ["IQ", "OQ", "UAT", "VSR"];
  } else if (dataIntegrity || gxpProcessImpact) {
    gxpImpactLevel = "MEDIUM";
    deliverables = ["IQ", "OQ", "VSR"];
  } else {
    gxpImpactLevel = "LOW";
    deliverables = ["VSR"];
  }

  // Upsert CsvValidationPlan
  let validationPlan = await CsvValidationPlan.findOne({
    where: { projectId }
  });

  if (validationPlan) {
    const oldValue = validationPlan.toJSON();
    await validationPlan.update({
      deliverables,
      status: "DRAFT"
    });
    await writeAudit({
      entityName: "csv_validation_plans",
      entityId: validationPlan.id,
      action: "UPDATE",
      oldValue,
      newValue: validationPlan.toJSON(),
      actor
    });
  } else {
    validationPlan = await CsvValidationPlan.create({
      projectId,
      deliverables,
      status: "DRAFT"
    });
    await writeAudit({
      entityName: "csv_validation_plans",
      entityId: validationPlan.id,
      action: "CREATE",
      newValue: validationPlan.toJSON(),
      actor
    });
  }

  // Update Project Current Phase
  await project.update({
    currentPhase: "IMPACT_ASSESSMENT",
    status: "IN_PROGRESS"
  });

  return {
    projectId,
    gxpImpactLevel,
    deliverables,
    validationPlan
  };
};

export const getValidationPlanByProjectId = async (
  projectId: string
): Promise<CsvValidationPlan | null> => {
  return CsvValidationPlan.findOne({ where: { projectId } });
};

export const approveValidationPlan = async (
  planId: string,
  actor: AuditActor
): Promise<CsvValidationPlan> => {
  const plan = await CsvValidationPlan.findByPk(planId);
  if (!plan) {
    throw { statusCode: 404, message: `Validation Plan ${planId} not found.` };
  }

  const oldValue = plan.toJSON();
  await plan.update({ status: "APPROVED" });

  await writeAudit({
    entityName: "csv_validation_plans",
    entityId: plan.id,
    action: "SIGN",
    oldValue,
    newValue: plan.toJSON(),
    actor
  });

  // Shift project phase to DESIGN_SPEC
  const project = await CsvProject.findByPk(plan.projectId);
  if (project) {
    await project.update({ currentPhase: "DESIGN_SPEC" });
  }

  return plan;
};
