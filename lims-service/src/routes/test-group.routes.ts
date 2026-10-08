import TestGroup from "../models/test-group.model";
import TestGroupItem from "../models/test-group-item.model";
import Group from "../models/group.model";
import Analysis from "../models/analysis.model";
import PhraseEntry from "../models/phrase-entry.model";
import AnalysisComponent from "../models/analysis-component.model";
import { fn, col, Op, Transaction } from "sequelize";
import { Request, Response } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validateDto } from "../middlewares/validate-dto.middleware";
import {
  buildCrudRouter,
  buildCrudService,
  contextFromRequest,
  CrudConfig,
  groupWhere
} from "../utils/crud-factory";
import {
  CreateTestGroupDto,
  ExpandTestSourcesDto,
  UpdateTestGroupDto
} from "../dtos/analytical.dto";
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

const router = buildCrudRouter({
  service,
  entityName: testGroupConfig.entityName,
  permissionEntity: testGroupConfig.permissionEntity,
  createDto: CreateTestGroupDto,
  updateDto: UpdateTestGroupDto,
  model: TestGroup,
  businessId: testGroupConfig.businessId
});

interface ExpandedTemplate {
  id: string;
  analysisId: string;
  name: string;
  componentCount: number;
  approved: boolean;
  components?: Record<string, unknown>[];
}

/** Expands picked Test Groups and Templates into their templates with component counts, in
 * one round trip — the sample test picker's preview. Assignment itself still re-validates. */
const expandTestSources = asyncHandler(async (req: Request, res: Response) => {
  const {
    testGroupIds = [],
    analysisIds = [],
    includeComponents = false
  } = req.body as ExpandTestSourcesDto;
  const { scope } = contextFromRequest(req);

  const groups = testGroupIds.length
    ? await TestGroup.findAll({
        where: {
          id: { [Op.in]: testGroupIds },
          isDeleted: false,
          ...groupWhere(TestGroup, scope)
        } as any,
        attributes: ["id", "testGroupId", "name"],
        include: [
          {
            model: TestGroupItem,
            as: "tests",
            attributes: ["analysisId", "sortOrder"],
            required: false
          }
        ]
      })
    : [];

  const templateIds = [
    ...new Set([
      ...groups.flatMap((g) =>
        ((g as any).tests as TestGroupItem[]).map((item) => item.analysisId)
      ),
      ...analysisIds
    ])
  ];
  const analyses = templateIds.length
    ? await Analysis.findAll({
        where: {
          id: { [Op.in]: templateIds },
          isDeleted: false,
          ...groupWhere(Analysis, scope)
        } as any,
        attributes: ["id", "analysisId", "name"],
        include: [
          {
            model: PhraseEntry,
            as: "approvalStatus",
            attributes: ["phraseEntryId"],
            required: false
          }
        ]
      })
    : [];
  const counts = templateIds.length
    ? ((await AnalysisComponent.findAll({
        where: { analysisId: { [Op.in]: templateIds } },
        attributes: ["analysisId", [fn("COUNT", col("id")), "count"]],
        group: ["analysisId"],
        raw: true
      })) as unknown as { analysisId: string; count: string }[])
    : [];
  const countOf = new Map(counts.map((c) => [c.analysisId, Number(c.count)]));

  const componentsOf = new Map<string, Record<string, unknown>[]>();
  if (includeComponents && templateIds.length) {
    const rows = await AnalysisComponent.findAll({
      where: { analysisId: { [Op.in]: templateIds } },
      attributes: [
        "id",
        "analysisId",
        "componentId",
        "name",
        "type",
        "unit",
        "list",
        "option",
        "min",
        "max",
        "sortOrder"
      ],
      order: [["sortOrder", "ASC"]],
      raw: true
    });
    for (const row of rows as unknown as Record<string, unknown>[]) {
      const key = String(row.analysisId);
      const list = componentsOf.get(key) ?? [];
      list.push(row);
      componentsOf.set(key, list);
    }
  }

  const templateOf = new Map<string, ExpandedTemplate>(
    analyses.map((a) => [
      a.id,
      {
        id: a.id,
        analysisId: a.analysisId,
        name: a.name,
        componentCount: countOf.get(a.id) ?? 0,
        approved:
          (a as any).approvalStatus?.phraseEntryId === APPROVED_ENTRY_KEY,
        ...(includeComponents
          ? { components: componentsOf.get(a.id) ?? [] }
          : {})
      }
    ])
  );
  const pick = (ids: string[]) =>
    ids.flatMap((id) => (templateOf.has(id) ? [templateOf.get(id)!] : []));

  const groupOrder = new Map(testGroupIds.map((id, index) => [id, index]));
  res.status(200).json({
    data: {
      groups: [...groups]
        .sort((a, b) => groupOrder.get(a.id)! - groupOrder.get(b.id)!)
        .map((g) => ({
          id: g.id,
          testGroupId: g.testGroupId,
          name: g.name,
          templates: pick(
            [...((g as any).tests as TestGroupItem[])]
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((item) => item.analysisId)
          )
        })),
      templates: pick(analysisIds)
    }
  });
});

router.post(
  "/expand",
  authorize(testGroupConfig.permissionEntity, "VIEW"),
  validateDto(ExpandTestSourcesDto),
  expandTestSources
);

export default router;
