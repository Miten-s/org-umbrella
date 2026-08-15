import Analysis from "../models/analysis.model";
import AnalysisComponent from "../models/analysis-component.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import InspectionPlan from "../models/inspection-plan.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateAnalysisDto, UpdateAnalysisDto } from "../dtos/analytical.dto";

/** Analyses, with the Component grid nested. */
export const analysisConfig: CrudConfig<Analysis> = {
  model: Analysis,
  entityName: "Analysis",
  permissionEntity: "ANALYSIS",
  uniqueField: "analysisId",
  businessId: { field: "analysisId", prefix: "ANL" },
  searchFields: ["analysisId", "name", "sopReference", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: PhraseEntry, as: "analysisType", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: PhraseEntry, as: "approvalStatus", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: InspectionPlan, as: "inspectionPlan", attributes: ["id", "inspectionId", "name"], required: false },
    { model: AnalysisComponent, as: "components", required: false }
  ],
  relationFields: {
    group: "groupId",
    analysisType: "analysisTypeId",
    approvalStatus: "approvalStatusId",
    inspectionPlan: "inspectionPlanId"
  },
  children: [
    {
      field: "components",
      model: AnalysisComponent,
      foreignKey: "analysisId",
      fields: ["componentId", "name", "description", "type", "unit", "calculation", "formula",
               "option", "list", "entity", "entityCriteria", "min", "max", "sortOrder"],
      matchKey: "componentId"
    }
  ]
};

const service = buildCrudService(analysisConfig);

export default buildCrudRouter({
  service,
  entityName: analysisConfig.entityName,
  permissionEntity: analysisConfig.permissionEntity,
  createDto: CreateAnalysisDto,
  updateDto: UpdateAnalysisDto,
  model: Analysis,
  businessId: analysisConfig.businessId
});
