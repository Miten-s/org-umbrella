import TestGroup from "../models/test-group.model";
import TestGroupItem from "../models/test-group-item.model";
import Group from "../models/group.model";
import Analysis from "../models/analysis.model";
import PhraseEntry from "../models/phrase-entry.model";
import { Op, Transaction } from "sequelize";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { CreateTestGroupDto, UpdateTestGroupDto } from "../dtos/analytical.dto";
import { APPROVED_ENTRY_KEY } from "../utils/approval-status";

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

/** Each row must name a distinct, existing Test Template. Only templates newly added to the
 * group must be Approved — one already in it that was later superseded doesn't block
 * unrelated edits to the group. */
const validateTests = async (
  payload: Record<string, any>,
  transaction: Transaction,
  existing?: TestGroup
) => {
  if (!Array.isArray(payload.tests)) return;
  const ids: string[] = payload.tests.map((row: any) => row?.analysisId);

  const analyses = await Analysis.findAll({
    where: { id: { [Op.in]: ids }, isDeleted: false },
    include: [
      {
        model: PhraseEntry,
        as: "approvalStatus",
        attributes: ["phraseEntryId"],
        required: false
      }
    ],
    transaction
  });
  const byId = new Map(analyses.map((a) => [a.id, a]));

  const seen = new Set<string>();
  for (const id of ids) {
    const analysis = byId.get(id);
    if (!analysis) throw reject("A selected Test Template no longer exists.");
    if (seen.has(id))
      throw reject(
        `"${analysis.name}" is added to this test group more than once.`
      );
    seen.add(id);
  }

  const alreadyInGroup = new Set(
    existing
      ? (
          await TestGroupItem.findAll({
            where: { testGroupId: existing.id },
            attributes: ["analysisId"],
            transaction
          })
        ).map((row) => row.analysisId)
      : []
  );
  for (const id of ids) {
    if (alreadyInGroup.has(id)) continue;
    const analysis = byId.get(id)!;
    const status = (analysis as any).approvalStatus?.phraseEntryId;
    if (status !== APPROVED_ENTRY_KEY)
      throw reject(
        `"${analysis.name}" is not Approved — only Approved Test Templates can be added to a test group.`
      );
  }
};

/** Test Groups — the reusable test list applied when logging a sample. */
export const testGroupConfig: CrudConfig<TestGroup> = {
  model: TestGroup,
  entityName: "Test Group",
  permissionEntity: "TEST_GROUP",
  uniqueField: "testGroupId",
  businessId: { field: "testGroupId", prefix: "TG" },
  searchFields: ["testGroupId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: TestGroupItem,
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
  relationFields: { group: "groupId" },

  validatePayload: validateTests,

  children: [
    {
      field: "tests",
      model: TestGroupItem,
      foreignKey: "testGroupId",
      fields: ["analysisId", "sortOrder"],
      matchKey: "analysisId"
    }
  ]
};

const service = buildCrudService(testGroupConfig);

export default buildCrudRouter({
  service,
  entityName: testGroupConfig.entityName,
  permissionEntity: testGroupConfig.permissionEntity,
  createDto: CreateTestGroupDto,
  updateDto: UpdateTestGroupDto,
  model: TestGroup,
  businessId: testGroupConfig.businessId
});
