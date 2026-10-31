import { ModelStatic, Op, Transaction, WhereOptions } from "sequelize";
import Batch from "../models/batch.model";
import Customer from "../models/customer.model";
import EntityTemplate from "../models/entity-template.model";
import Group from "../models/group.model";
import Instrument from "../models/instrument.model";
import LimsUser from "../models/lims-user.model";
import Location from "../models/location.model";
import Lot from "../models/lot.model";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import Project from "../models/project.model";
import Stock from "../models/stock.model";
import StockBatch from "../models/stock-batch.model";
import Supplier from "../models/supplier.model";
import {
  EntityField,
  ENTITY_TABLES,
  EntityTable
} from "../configs/entity-template-catalog";
import { AccessScope, groupWhere } from "../utils/crud-factory";
import { compileQuery, QueryGroup } from "../utils/entity-query";

const MODELS: Record<string, ModelStatic<any>> = {
  INSTRUMENT: Instrument,
  STOCK: Stock,
  STOCK_BATCH: StockBatch,
  LIMS_USER: LimsUser,
  LOCATION: Location,
  SUPPLIER: Supplier,
  CUSTOMER: Customer,
  LOT: Lot,
  BATCH: Batch,
  GROUP: Group,
  PROJECT: Project
};

/** Tables a field can point at that can't be queried themselves. */
const LOOKUP_NAMES: Record<string, string[]> = {
  GROUP: ["name"],
  PROJECT: ["name", "projectId"]
};

const PAGE_SIZE = 25;

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

const nameColumnsOf = (key: string) =>
  ENTITY_TABLES[key]?.nameColumns ?? LOOKUP_NAMES[key];

const labelOf = (row: Record<string, any>, columns: string[]) =>
  columns
    .map((column) => row[column])
    .filter(Boolean)
    .join(" · ");

const searchWhere = (columns: string[], search?: string): WhereOptions =>
  search?.trim()
    ? {
        [Op.or]: columns.map((column) => ({
          [column]: {
            [Op.iLike]: `%${search.trim().replace(/[%_\\]/g, "\\$&")}%`
          }
        }))
      }
    : {};

const notDeleted = (model: ModelStatic<any>): WhereOptions =>
  model.getAttributes().isDeleted ? { isDeleted: false } : {};

/** The records of a table that a query matches, as the caller's groups may see them. */
const matching = (
  entity: string,
  query: QueryGroup,
  scope: AccessScope,
  extra: WhereOptions = {}
) => {
  const table: EntityTable = ENTITY_TABLES[entity];
  const model = MODELS[entity];
  const parents = [
    ...new Set(
      JSON.stringify(query)
        .match(/"field":"[^"]+"/g)
        ?.flatMap((match) => {
          const via = table.fields[match.slice(9, -1)]?.via;
          return via ? [via] : [];
        }) ?? []
    )
  ];
  return {
    model,
    options: {
      where: {
        [Op.and]: [
          notDeleted(model),
          groupWhere(model, scope),
          compileQuery(query, table),
          extra
        ]
      } as WhereOptions,
      include: parents.map((as) => ({ association: as, attributes: [] })),
      subQuery: false
    }
  };
};

const toOptions = (rows: any[], columns: string[]) =>
  rows.map((row) => ({
    id: row.id as string,
    label: labelOf(row.get(), columns) || (row.id as string)
  }));

/** One page of the records a query matches, for the preview and the analyst's dropdown. */
export const recordPage = async (
  entity: string,
  query: QueryGroup,
  scope: AccessScope,
  { search, page = 1 }: { search?: string; page?: number }
) => {
  const columns = ENTITY_TABLES[entity].nameColumns;
  const { model, options } = matching(
    entity,
    query,
    scope,
    searchWhere(columns, search)
  );
  const { rows, count } = await model.findAndCountAll({
    ...options,
    distinct: true,
    order: [[columns[0], "ASC"]],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  });
  return {
    data: toOptions(rows, columns),
    total: count,
    hasMore: page * PAGE_SIZE < count
  };
};

/** The name to store for a picked record; rejects anything the template doesn't offer. */
export const entityPickLabel = async (
  row: {
    componentName?: string | null;
    componentEntityTemplateId?: string | null;
  },
  value: unknown,
  scope: AccessScope,
  transaction?: Transaction
): Promise<string | null> => {
  const id = value === undefined || value === null ? "" : String(value).trim();
  if (!id) return null;
  const fail = () =>
    reject(`${row.componentName}: pick a record from the list.`);
  const template = row.componentEntityTemplateId
    ? await EntityTemplate.findByPk(row.componentEntityTemplateId, {
        transaction
      })
    : null;
  if (!template || !/^[0-9a-f-]{36}$/i.test(id)) throw fail();
  const { model, options } = matching(
    template.entity,
    template.query as unknown as QueryGroup,
    scope,
    { id }
  );
  const record = await model.findOne({ ...options, transaction });
  if (!record) throw fail();
  return labelOf(
    record.get(),
    ENTITY_TABLES[template.entity].nameColumns
  ).slice(0, 300);
};

/** The values a rule's dropdown offers for a pick-list or table field. */
export const fieldOptions = async (
  field: EntityField,
  scope: AccessScope,
  { search, page = 1 }: { search?: string; page?: number }
) => {
  const source = field.source;
  if (!source) return { data: [], hasMore: false };
  const paging = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };

  if ("phrase" in source) {
    const { rows, count } = await PhraseEntry.findAndCountAll({
      where: searchWhere(["name"], search),
      include: [
        {
          model: Phrase,
          as: "phrase",
          where: { phrase: source.phrase },
          attributes: [],
          required: true
        }
      ],
      order: [["name", "ASC"]],
      subQuery: false,
      ...paging
    });
    return {
      data: toOptions(rows, ["name"]),
      hasMore: page * PAGE_SIZE < count
    };
  }

  const model = MODELS[source.table];
  const columns = nameColumnsOf(source.table);
  const { rows, count } = await model.findAndCountAll({
    where: {
      [Op.and]: [
        notDeleted(model),
        groupWhere(model, scope),
        searchWhere(columns, search)
      ]
    } as WhereOptions,
    order: [[columns[0], "ASC"]],
    ...paging
  });
  return {
    data: toOptions(rows, columns),
    hasMore: page * PAGE_SIZE < count
  };
};
