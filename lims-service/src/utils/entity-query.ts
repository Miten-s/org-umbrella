import { Op, WhereOptions } from "sequelize";
import {
  EntityField,
  EntityTable,
  MAX_QUERY_DEPTH,
  OPERATORS
} from "../configs/entity-template-catalog";

export interface QueryRule {
  field: string;
  operator: string;
  value: unknown;
}

export interface QueryGroup {
  combinator: "and" | "or";
  rules: (QueryRule | QueryGroup)[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isGroup = (node: QueryRule | QueryGroup): node is QueryGroup =>
  Array.isArray((node as QueryGroup).rules);

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

const assertRule = (rule: QueryRule, table: EntityTable) => {
  const field = table.fields[rule.field];
  if (!field) throw reject("Pick a field for every rule.");
  if (!OPERATORS[field.type].includes(rule.operator))
    throw reject(`${field.label}: pick a valid operator.`);
  const value = text(rule.value);
  if (!value) throw reject(`${field.label}: enter a value.`);
  if (field.type === "ref" && !UUID.test(value))
    throw reject(`${field.label}: pick a value from the list.`);
  if (field.type === "number" && !Number.isFinite(Number(value)))
    throw reject(`${field.label}: enter a number.`);
  if (field.type === "date" && Number.isNaN(Date.parse(value)))
    throw reject(`${field.label}: enter a valid date.`);
};

/** A saved query only ever holds known fields, operators and well-formed values. */
export const assertQuery = (
  node: QueryGroup,
  table: EntityTable,
  depth = 1
): void => {
  if (depth > MAX_QUERY_DEPTH)
    throw reject(`Groups can only go ${MAX_QUERY_DEPTH} levels deep.`);
  if (!["and", "or"].includes(node?.combinator) || !Array.isArray(node.rules))
    throw reject("The conditions are not valid.");
  for (const child of node.rules)
    if (isGroup(child)) {
      if (!child.rules.length) throw reject("A group can't be empty.");
      assertQuery(child, table, depth + 1);
    } else assertRule(child, table);
};

const columnOf = (field: EntityField) =>
  field.via ? `$${field.via}.${field.column}$` : field.column;

const compileRule = (rule: QueryRule, table: EntityTable): WhereOptions => {
  const field = table.fields[rule.field];
  const column = columnOf(field);
  const value = field.type === "number" ? Number(rule.value) : text(rule.value);
  switch (rule.operator) {
    case "=":
      return { [column]: value };
    case "!=":
      return {
        [Op.or]: [{ [column]: { [Op.ne]: value } }, { [column]: null }]
      };
    case "contains":
      return {
        [column]: {
          [Op.iLike]: `%${String(value).replace(/[%_\\]/g, "\\$&")}%`
        }
      };
    case ">":
      return { [column]: { [Op.gt]: value } };
    case ">=":
      return { [column]: { [Op.gte]: value } };
    case "<":
    case "before":
      return { [column]: { [Op.lt]: value } };
    case "<=":
      return { [column]: { [Op.lte]: value } };
    case "after":
      return { [column]: { [Op.gt]: value } };
    default:
      throw reject("The conditions are not valid.");
  }
};

/** The validated query as a Sequelize filter; an empty query matches every record. */
export const compileQuery = (
  node: QueryGroup,
  table: EntityTable
): WhereOptions => {
  const parts = node.rules.map((child) =>
    isGroup(child) ? compileQuery(child, table) : compileRule(child, table)
  );
  return { [node.combinator === "or" ? Op.or : Op.and]: parts };
};
