import Specification from "../models/specification.model";
import SpecLimit from "../models/spec-limit.model";
import Group from "../models/group.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import {
  CreateSpecificationDto,
  UpdateSpecificationDto
} from "../dtos/analytical.dto";

/** Specifications and their limit rows. */
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
    { model: SpecLimit, as: "limits", required: false }
  ],
  relationFields: { group: "groupId" },

  // The list column only shows a count (LimsSpecification.columns.tsx:
  // `limits?.length`) — no row content needed for the list at all.
  listRelationAttributes: { limits: ["id"] },

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
        "min",
        "max",
        "text",
        "phrase",
        "boolean",
        "calculation",
        "sortOrder"
      ],
      matchKey: "componentName"
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
