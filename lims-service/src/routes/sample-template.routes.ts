import { Transaction } from "sequelize";
import SampleTemplate from "../models/sample-template.model";
import SampleTemplateTest from "../models/sample-template-test.model";
import Analysis from "../models/analysis.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Project from "../models/project.model";
import Specification from "../models/specification.model";
import Location from "../models/location.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import {
  CreateSampleTemplateDto,
  UpdateSampleTemplateDto
} from "../dtos/execution.dto";
import { assertTemplatesAssignable } from "../services/approved-templates.service";

const validateTests = async (
  payload: Record<string, any>,
  transaction: Transaction,
  existing?: SampleTemplate
) => {
  if (!Array.isArray(payload.tests)) return;
  const attached = existing
    ? await SampleTemplateTest.findAll({
        where: { sampleTemplateId: existing.id },
        attributes: ["analysisId"],
        transaction
      })
    : [];
  await assertTemplatesAssignable(
    payload.tests.map((row: any) => row?.analysisId),
    new Set(attached.map((row) => row.analysisId)),
    transaction
  );
};

/** Sample Templates — saved defaults that pre-fill new Sample forms. */
export const sampleTemplateConfig: CrudConfig<SampleTemplate> = {
  model: SampleTemplate,
  entityName: "Sample Template",
  permissionEntity: "SAMPLE_TEMPLATE",
  uniqueField: "sampleTemplateId",
  businessId: { field: "sampleTemplateId", prefix: "STPL" },
  searchFields: ["sampleTemplateId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: PhraseEntry,
      as: "sampleType",
      attributes: ["id", "phraseEntryId", "name"],
      required: false
    },
    {
      model: Project,
      as: "project",
      attributes: ["id", "projectId", "name"],
      required: false
    },
    {
      model: Specification,
      as: "specification",
      attributes: ["id", "specId", "name"],
      required: false
    },
    {
      model: Location,
      as: "location",
      attributes: [
        "id",
        "locationId",
        "locationName",
        ["location_name", "name"]
      ],
      required: false
    },
    {
      model: SampleTemplateTest,
      as: "tests",
      required: false,
      include: [
        {
          model: Analysis,
          as: "analysis",
          attributes: ["id", "analysisId", "name"],
          required: false
        }
      ]
    }
  ],
  relationFields: {
    group: "groupId",
    sampleType: "sampleTypeId",
    project: "projectId",
    specification: "specificationId",
    location: "locationId"
  },
  validatePayload: validateTests,
  children: [
    {
      field: "tests",
      model: SampleTemplateTest,
      foreignKey: "sampleTemplateId",
      fields: ["analysisId", "sortOrder"],
      matchKey: "analysisId"
    }
  ]
};

const service = buildCrudService(sampleTemplateConfig);

export default buildCrudRouter({
  service,
  entityName: sampleTemplateConfig.entityName,
  permissionEntity: sampleTemplateConfig.permissionEntity,
  createDto: CreateSampleTemplateDto,
  updateDto: UpdateSampleTemplateDto,
  model: SampleTemplate,
  businessId: sampleTemplateConfig.businessId
});
