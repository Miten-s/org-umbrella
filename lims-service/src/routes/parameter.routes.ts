import Parameter from "../models/parameter.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateParameterDto, UpdateParameterDto } from "../dtos/commercial.dto";

/** Reusable parameter definitions used by Stock and Stock Batch grids. */
export const parameterConfig: CrudConfig<Parameter> = {
  model: Parameter,
  entityName: "Parameter",
  permissionEntity: "PARAMETER",
  uniqueField: "parameterId",
  businessId: { field: "parameterId", prefix: "PARAM" },
  searchFields: ["parameterId", "parameterName", "unit"],
  defaultSortBy: "parameterName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: PhraseEntry, as: "parameterType", attributes: ["id", "phraseEntryId", "name"], required: false }
  ],
  relationFields: { group: "groupId", parameterType: "parameterTypeId" }
};

const service = buildCrudService(parameterConfig);

export default buildCrudRouter({
  service,
  entityName: parameterConfig.entityName,
  permissionEntity: parameterConfig.permissionEntity,
  createDto: CreateParameterDto,
  updateDto: UpdateParameterDto,
  model: Parameter,
  businessId: parameterConfig.businessId
});
