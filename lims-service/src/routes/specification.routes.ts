import Specification from "../models/specification.model";
import SpecLimit from "../models/spec-limit.model";
import Group from "../models/group.model";
import TestGroup from "../models/test-group.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import {
  CreateSpecificationDto,
  UpdateSpecificationDto
} from "../dtos/analytical.dto";
import { validateSpecLimits } from "../services/spec-limits.service";

/** Specifications and their limit rows — a snapshot of Test Template components. */
export const specificationConfig: CrudConfig<Specification> = {
  model: Specification,
  entityName: "Specification",
  permissionEntity: "SPECIFICATION",
  uniqueField: "specId",
  businessId: { field: "specId", prefix: "SPEC" },
  searchFields: ["specId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: SpecLimit,
      as: "limits",
      required: false,
      // Only what the editor needs — a specification can carry ~11,000 limits.
      attributes: [
        "id",
        "analysisName",
        "componentName",
        "analysisId",
        "componentId",
        "sourceTestGroupId",
        "min",
        "max",
        "text",
        "phrase",
        "boolean",
        "calculation",
        "sortOrder"
      ],
      include: [
        {
          model: TestGroup,
          as: "sourceTestGroup",
          required: false,
          attributes: ["id", "name"]
        }
      ]
    }
  ],
  relationFields: { group: "groupId" },

  // The list column only shows a count (LimsSpecification.columns.tsx:
  // `limits?.length`) — no row content needed for the list at all.
  listRelationAttributes: { limits: ["id"] },

  validatePayload: validateSpecLimits,

  children: [
    {
      field: "limits",
      model: SpecLimit,
      foreignKey: "specificationId",
      fields: [
        "analysisName",
        "componentName",
        "analysisId",
        "componentId",
        "sourceTestGroupId",
        "min",
        "max",
        "text",
        "phrase",
        "boolean",
        "calculation",
        "sortOrder"
      ],
      // A component's UUID is unique; its name isn't (two templates can both have "Assay").
      // Legacy free-text rows have none and fall back to their own row id.
      matchKey: "componentId"
    }
  ]
};

const service = buildCrudService(specificationConfig);

export default buildCrudRouter({
  service,
  entityName: specificationConfig.entityName,
  permissionEntity: specificationConfig.permissionEntity,
  createDto: CreateSpecificationDto,
  updateDto: UpdateSpecificationDto,
  model: Specification,
  businessId: specificationConfig.businessId,
  hasAttachments: true
});
