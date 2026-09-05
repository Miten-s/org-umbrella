import Parameter from "../models/parameter.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateParameterDto, UpdateParameterDto } from "../dtos/commercial.dto";

/** Checks the default value against the parameter's own Type (Numeric/Date/Boolean) so
 * "Numeric" + "not-a-number" can never be saved. Matches `phraseEntryId`, not `name` — per
 * phrase.routes.ts only the parent Phrase's `phrase` code is system-locked, so this is the
 * least casually-renamed field available, not a truly frozen one. */
const validateDefaultValueAgainstType = async (
  typeId: string | null | undefined,
  defaultValue: string | null | undefined
) => {
  const value = defaultValue == null ? "" : String(defaultValue).trim();
  if (!typeId || !value) return;

  const typeEntry = await PhraseEntry.findByPk(typeId);
  const typeCode = String((typeEntry as any)?.phraseEntryId ?? "").trim().toLowerCase();

  if (/(^|_)numeric$/.test(typeCode) && Number.isNaN(Number(value))) {
    throw Object.assign(
      new Error(`Default value "${value}" is not a valid number for a Numeric parameter.`),
      { statusCode: 400 }
    );
  }
  if (/(^|_)date$/.test(typeCode) && Number.isNaN(Date.parse(value))) {
    throw Object.assign(
      new Error(`Default value "${value}" is not a valid date for a Date parameter.`),
      { statusCode: 400 }
    );
  }
  if (/(^|_)boolean$/.test(typeCode) && !["true", "false"].includes(value.toLowerCase())) {
    throw Object.assign(
      new Error(`Default value "${value}" must be true or false for a Boolean parameter.`),
      { statusCode: 400 }
    );
  }
};

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
  relationFields: { group: "groupId", parameterType: "parameterTypeId" },
  beforeCreate: async (payload) => {
    await validateDefaultValueAgainstType(payload.parameterTypeId, payload.defaultValue);
    return payload;
  },
  beforeUpdate: async (payload, existing) => {
    await validateDefaultValueAgainstType(
      "parameterTypeId" in payload ? payload.parameterTypeId : existing.parameterTypeId,
      "defaultValue" in payload ? payload.defaultValue : existing.defaultValue
    );
    return payload;
  }
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
