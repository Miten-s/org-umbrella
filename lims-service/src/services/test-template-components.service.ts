import { Transaction } from "sequelize";
import AnalysisComponent from "../models/analysis-component.model";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import Location from "../models/location.model";
import Stock from "../models/stock.model";
import Batch from "../models/batch.model";
import Analysis from "../models/analysis.model";
import {
  BOOLEAN_OPTIONS,
  COMPONENT_ENTITIES,
  COMPONENT_TYPES,
  ComponentType,
  TYPE_FIELDS,
  TYPE_SPECIFIC_FIELDS,
  formulaReferences,
  isFormulaWellFormed
} from "../configs/component-types";
import { UNIT_PHRASE } from "../configs/pick-list-units";

type Row = Record<string, any>;

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

const isTyped = (row: Row): row is Row & { type: ComponentType } =>
  COMPONENT_TYPES.includes(row?.type);

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

const label = (row: Row) => `"${text(row.componentId) || text(row.name)}"`;

/** A row saved before types existed — compared field by field to decide "untouched". */
const LEGACY_FIELDS = ["name", "description", "type", ...TYPE_SPECIFIC_FIELDS];

const ENTITY_MODELS = {
  GROUP: Group,
  LOCATION: Location,
  STOCK: Stock,
  BATCH: Batch
} as const;

/** Clears every column a typed row's type doesn't use, so no stray value is ever stored.
 * Legacy (untyped) rows pass through untouched. */
export const normalizeComponents = (payload: Row): Row => {
  if (!Array.isArray(payload.components)) return payload;
  return {
    ...payload,
    components: payload.components.map((row: Row) => {
      if (!isTyped(row)) return row;
      const keep = new Set(TYPE_FIELDS[row.type]);
      const cleaned: Row = { ...row };
      for (const field of TYPE_SPECIFIC_FIELDS)
        if (!keep.has(field)) cleaned[field] = null;
      return cleaned;
    })
  };
};

const assertNumber = (row: Row, field: "min" | "max") => {
  const value = text(row[field]);
  if (value && Number.isNaN(Number(value)))
    throw reject(
      `${label(row)}: ${field === "min" ? "Min" : "Max"} must be a number.`
    );
};

/** Detects `A → B → A` between Calculation components. */
const assertNoCycles = (rows: Row[]) => {
  const refs = new Map<string, string[]>(
    rows
      .filter((row) => row.type === "CALCULATION")
      .map((row) => [
        text(row.componentId),
        formulaReferences(text(row.formula))
      ])
  );
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, path: string[]) => {
    if (done.has(id)) return;
    if (visiting.has(id))
      throw reject(
        `Circular formula: ${[...path, id].map((p) => `{${p}}`).join(" → ")}.`
      );
    visiting.add(id);
    for (const next of refs.get(id) ?? []) visit(next, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const id of refs.keys()) visit(id, []);
};

const assertCriteria = async (row: Row, transaction: Transaction) => {
  const raw = text(row.entityCriteria);
  if (!raw) return;
  let criteria: { field?: string; value?: string };
  try {
    criteria = JSON.parse(raw);
  } catch {
    throw reject(`${label(row)}: Entity criteria is not valid.`);
  }
  const source = COMPONENT_ENTITIES[row.entity]?.[criteria.field ?? ""];
  if (!source || !criteria.value)
    throw reject(`${label(row)}: pick both a criteria field and a value.`);

  const exists =
    "phrase" in source
      ? await PhraseEntry.findOne({
          where: { id: criteria.value },
          include: [
            {
              model: Phrase,
              as: "phrase",
              where: { phrase: source.phrase },
              required: true
            }
          ],
          transaction
        })
      : await (ENTITY_MODELS[source.entity] as any).findOne({
          where: { id: criteria.value, isDeleted: false },
          transaction
        });
  if (!exists)
    throw reject(`${label(row)}: the criteria value no longer exists.`);
};

/** Validates the Components grid of a Test Template. Untyped rows saved before component
 * types existed are accepted only while unchanged — editing one means picking a Type. */
export const validateComponents = async (
  payload: Row,
  transaction: Transaction,
  existing?: Analysis
) => {
  if (!Array.isArray(payload.components)) return;
  const rows: Row[] = payload.components;

  const seenIds = new Set<string>();
  for (const row of rows) {
    const id = text(row.componentId);
    if (seenIds.has(id))
      throw reject(`Component ID "${id}" is used more than once.`);
    seenIds.add(id);
  }

  const stored = existing
    ? await AnalysisComponent.findAll({
        where: { analysisId: existing.id },
        transaction
      })
    : [];
  const storedById = new Map(
    stored.map((row) => [text(row.componentId), row.toJSON() as Row])
  );

  for (const row of rows.filter((r) => !isTyped(r))) {
    const before = storedById.get(text(row.componentId));
    const untouched =
      before && LEGACY_FIELDS.every((f) => text(before[f]) === text(row[f]));
    if (!untouched)
      throw reject(`${label(row)}: pick a Type for this component.`);
  }

  const typed = rows.filter(isTyped);
  const byId = new Map(typed.map((row) => [text(row.componentId), row]));

  const unitNames = new Set<string>();
  if (typed.some((row) => text(row.unit))) {
    const entries = await PhraseEntry.findAll({
      attributes: ["name"],
      include: [
        {
          model: Phrase,
          as: "phrase",
          where: { phrase: UNIT_PHRASE.phrase, isDeleted: false },
          required: true
        }
      ],
      transaction
    });
    entries.forEach((entry) => unitNames.add(text(entry.name)));
  }

  for (const row of typed) {
    if (!text(row.name)) throw reject(`${label(row)}: Name is required.`);
    if (!text(row.description))
      throw reject(`${label(row)}: Description is required.`);

    if (row.type === "VALUE" || row.type === "CALCULATION") {
      if (text(row.unit) && !unitNames.has(text(row.unit)))
        throw reject(`${label(row)}: pick a Unit from the Units pick list.`);
      assertNumber(row, "min");
      assertNumber(row, "max");
      if (text(row.min) && text(row.max) && Number(row.min) > Number(row.max))
        throw reject(`${label(row)}: Min can't be greater than Max.`);
    }

    if (row.type === "CALCULATION") {
      const formula = text(row.formula);
      if (!formula) throw reject(`${label(row)}: Formula is required.`);
      if (!isFormulaWellFormed(formula))
        throw reject(
          `${label(row)}: the formula may only use numbers, + - * / ( ) and {Component ID}.`
        );
      for (const ref of formulaReferences(formula)) {
        const target = byId.get(ref);
        if (ref === text(row.componentId))
          throw reject(`${label(row)}: a formula can't refer to itself.`);
        if (!target || !["VALUE", "CALCULATION"].includes(target.type))
          throw reject(
            `${label(row)}: {${ref}} must be a Value or Calculation component in this template.`
          );
      }
    }

    if (row.type === "LIST") {
      if (!text(row.list)) throw reject(`${label(row)}: pick a List.`);
      const list = await Phrase.findOne({
        where: { phrase: text(row.list), isDeleted: false },
        transaction
      });
      if (!list)
        throw reject(`${label(row)}: the chosen List no longer exists.`);
      if (text(row.option)) {
        const option = await PhraseEntry.findOne({
          where: { phraseId: list.id, phraseEntryId: text(row.option) },
          transaction
        });
        if (!option)
          throw reject(`${label(row)}: the default Option isn't in that List.`);
      }
    }

    if (row.type === "BOOLEAN") {
      if (!(BOOLEAN_OPTIONS as readonly string[]).includes(text(row.option)))
        throw reject(`${label(row)}: pick an answer pair for this Boolean.`);
    }

    if (row.type === "ENTITY") {
      if (!COMPONENT_ENTITIES[text(row.entity)])
        throw reject(`${label(row)}: pick an Entity.`);
      await assertCriteria(row, transaction);
    }
  }

  assertNoCycles(typed);
};
