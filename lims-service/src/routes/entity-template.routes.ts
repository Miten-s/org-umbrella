import { Router, Request, Response } from "express";
import AnalysisComponent from "../models/analysis-component.model";
import EntityTemplate from "../models/entity-template.model";
import Group from "../models/group.model";
import {
  buildCrudRouter,
  buildCrudService,
  contextFromRequest,
  CrudConfig,
  groupWhere
} from "../utils/crud-factory";
import {
  ENTITY_TABLES,
  MAX_QUERY_DEPTH,
  OPERATORS
} from "../configs/entity-template-catalog";
import {
  CreateEntityTemplateDto,
  UpdateEntityTemplateDto
} from "../dtos/master-data.dto";
import { authorize } from "../middlewares/authorize.middleware";
import asyncHandler from "../middlewares/error.middleware";
import { assertQuery, QueryGroup } from "../utils/entity-query";
import { fieldOptions, recordPage } from "../services/entity-records.service";

const fail = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

const IN_USE_MESSAGE =
  "This Entity Template is used by a Test Template component, so it can't be removed.";

const inUse = (ids: string[]) =>
  AnalysisComponent.count({ where: { entityTemplateId: ids } });

/** Entity Templates — a table plus saved conditions, reusable wherever a record is picked. */
export const entityTemplateConfig: CrudConfig<EntityTemplate> = {
  model: EntityTemplate,
  entityName: "Entity Template",
  permissionEntity: "ENTITY_TEMPLATE",
  uniqueField: "entityTemplateId",
  businessId: { field: "entityTemplateId", prefix: "ENT" },
  searchFields: ["entityTemplateId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false }
  ],
  relationFields: { group: "groupId" },
  validatePayload: async (payload, transaction, existing) => {
    const entity = payload.entity ?? existing?.entity;
    const table = ENTITY_TABLES[entity];
    if (!table) throw fail("Pick a table.");
    assertQuery(
      (payload.query ?? existing?.query) as unknown as QueryGroup,
      table
    );
    if (existing && entity !== existing.entity) {
      const used = await AnalysisComponent.count({
        where: { entityTemplateId: existing.id },
        transaction
      });
      if (used)
        throw fail(
          "This template is used by a Test Template component, so its table can't change."
        );
    }
  }
};

const service = buildCrudService(entityTemplateConfig);

const crudRouter = buildCrudRouter({
  service,
  entityName: entityTemplateConfig.entityName,
  permissionEntity: entityTemplateConfig.permissionEntity,
  createDto: CreateEntityTemplateDto,
  updateDto: UpdateEntityTemplateDto,
  model: EntityTemplate,
  businessId: entityTemplateConfig.businessId
});

const pageParams = (req: Request) => ({
  search: req.query.search as string | undefined,
  page: Math.max(Number(req.query.page) || 1, 1)
});

const router = Router();

router.get(
  "/catalog",
  authorize("ENTITY_TEMPLATE", "VIEW"),
  (_req: Request, res: Response) => {
    res.status(200).json({
      maxDepth: MAX_QUERY_DEPTH,
      operators: OPERATORS,
      tables: Object.entries(ENTITY_TABLES).map(([key, table]) => ({
        key,
        label: table.label,
        fields: Object.entries(table.fields).map(([field, config]) => ({
          key: field,
          label: config.label,
          type: config.type
        }))
      }))
    });
  }
);

router.get(
  "/catalog/:entity/:field/options",
  authorize("ENTITY_TEMPLATE", "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const field =
      ENTITY_TABLES[req.params.entity as string]?.fields[
        req.params.field as string
      ];
    if (!field) return res.status(404).json({ message: "Unknown field." });
    const { scope } = contextFromRequest(req);
    res.status(200).json(await fieldOptions(field, scope, pageParams(req)));
  })
);

router.post(
  "/preview",
  authorize("ENTITY_TEMPLATE", "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const { entity, query } = req.body as {
      entity?: string;
      query?: QueryGroup;
    };
    const table = entity ? ENTITY_TABLES[entity] : undefined;
    if (!table) throw fail("Pick a table.");
    assertQuery(query as QueryGroup, table);
    const { scope } = contextFromRequest(req);
    res
      .status(200)
      .json(await recordPage(entity!, query as QueryGroup, scope, {}));
  })
);

/** Whoever builds a Test Template picks from these without managing Entity Templates. */
router.get(
  "/for-entity/:entity",
  authorize("ANALYSIS", "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const { scope } = contextFromRequest(req);
    const rows = await EntityTemplate.findAll({
      where: {
        entity: req.params.entity as string,
        isDeleted: false,
        ...groupWhere(EntityTemplate, scope)
      } as any,
      attributes: ["id", "entityTemplateId", "name"],
      order: [["name", "ASC"]]
    });
    res.status(200).json({ data: rows });
  })
);

/** The analyst's dropdown; a sample's user reaches it without Entity Template access. */
router.get(
  "/:id/records",
  authorize("SAMPLE", "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const template = await EntityTemplate.findByPk(req.params.id as string);
    if (!template) return res.status(404).json({ message: "Not found." });
    const { scope } = contextFromRequest(req);
    res
      .status(200)
      .json(
        await recordPage(
          template.entity,
          template.query as unknown as QueryGroup,
          scope,
          pageParams(req)
        )
      );
  })
);

router.delete(
  "/:id",
  authorize("ENTITY_TEMPLATE", "DELETE"),
  asyncHandler(async (req: Request, res: Response, next) => {
    if (await inUse([req.params.id as string]))
      return res.status(409).json({ message: IN_USE_MESSAGE });
    next();
  })
);

router.post(
  "/bulk-delete",
  authorize("ENTITY_TEMPLATE", "DELETE"),
  asyncHandler(async (req: Request, res: Response, next) => {
    if (await inUse((req.body as { ids?: string[] })?.ids ?? []))
      return res.status(409).json({ message: IN_USE_MESSAGE });
    next();
  })
);

router.use(crudRouter);

export default router;
