import { Op, Transaction } from "sequelize";
import SpecLimit from "../models/spec-limit.model";
import Specification from "../models/specification.model";
import Analysis from "../models/analysis.model";
import AnalysisComponent from "../models/analysis-component.model";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import { COMPONENT_TYPES } from "../configs/component-types";
import { APPROVED_ENTRY_KEY } from "../utils/approval-status";

type Row = Record<string, any>;

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

const LIMIT_FIELDS = ["min", "max", "text", "phrase", "boolean", "calculation"];

/** Which limit columns each component type uses — the rest are cleared on save. */
const LIMITS_BY_TYPE: Record<string, string[]> = {
  VALUE: ["min", "max"],
  CALCULATION: ["min", "max"],
  LIST: ["phrase"],
  BOOLEAN: ["boolean"],
  TEXT: ["text"]
};

/** Free-text rows from before limits were picked from Test Templates. */
const LEGACY_FIELDS = ["analysisName", "componentName", ...LIMIT_FIELDS];

/**
 * Specification limit rows are a snapshot of Test Template components — adding a Test Group
 * just adds its templates' components; nothing stays linked to the group. Each linked row
 * must name a real component of its template; names are re-stamped from the source and
 * limit columns the component's type doesn't use are cleared. Mutates `payload.limits`
 * rows in place, since the same objects are what gets saved.
 */
export const validateSpecLimits = async (
  payload: Row,
  transaction: Transaction,
  existing?: Specification
) => {
  if (!Array.isArray(payload.limits)) return;
  const rows: Row[] = payload.limits;

  const stored = existing
    ? await SpecLimit.findAll({
        where: { specificationId: existing.id },
        transaction
      })
    : [];
  const storedById = new Map(
    stored.map((row) => [row.id, row.toJSON() as Row])
  );
  const storedComponentIds = new Set(
    stored.map((row) => row.componentId).filter(Boolean)
  );

  for (const row of rows.filter((r) => !r.componentId)) {
    const before = row.id ? storedById.get(row.id) : undefined;
    const untouched =
      before && LEGACY_FIELDS.every((f) => text(before[f]) === text(row[f]));
    if (!untouched)
      throw reject(
        "Limits can only be added from a Test Template or Test Group."
      );
  }

  const linked = rows.filter((r) => r.componentId);
  if (!linked.length) return;

  const ids = [...new Set(linked.map((r) => String(r.componentId)))];
  const components = await AnalysisComponent.findAll({
    where: { id: { [Op.in]: ids } },
    transaction
  });
  const componentById = new Map(components.map((c) => [c.id, c]));

  const seen = new Set<string>();
  for (const row of linked) {
    if (seen.has(row.componentId)) {
      const name = componentById.get(row.componentId)?.name;
      throw reject(
        `${name ? `"${name}"` : "A component"} is in this specification more than once.`
      );
    }
    seen.add(row.componentId);
  }

  const analyses = await Analysis.findAll({
    where: {
      id: { [Op.in]: [...new Set(components.map((c) => c.analysisId))] }
    },
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
  const analysisById = new Map(analyses.map((a) => [a.id, a]));

  // Every LIST answer checked in one query rather than one per row.
  const listAnswers = linked.filter(
    (row) =>
      text(componentById.get(row.componentId)?.type) === "LIST" &&
      text(row.phrase)
  );
  const validAnswers = new Set<string>();
  if (listAnswers.length) {
    const entries = await PhraseEntry.findAll({
      where: {
        phraseEntryId: {
          [Op.in]: [...new Set(listAnswers.map((row) => text(row.phrase)))]
        }
      },
      attributes: ["phraseEntryId"],
      include: [
        { model: Phrase, as: "phrase", attributes: ["phrase"], required: true }
      ],
      transaction
    });
    for (const entry of entries)
      validAnswers.add(
        `${(entry as any).phrase.phrase}|${entry.phraseEntryId}`
      );
  }

  for (const row of linked) {
    const component = componentById.get(row.componentId);
    const analysis = component && analysisById.get(component.analysisId);
    if (
      !component ||
      !analysis ||
      (row.analysisId && row.analysisId !== analysis.id)
    )
      throw reject(
        `${component?.name ? `"${component.name}"` : "A component"} is no longer part of its Test Template — remove it and add it again.`
      );

    // Only newly-added rows must come from an Approved template; an existing row whose
    // template was superseded later doesn't block unrelated edits.
    const isNew = !storedComponentIds.has(row.componentId);
    const status = (analysis as any).approvalStatus?.phraseEntryId;
    if (isNew && (analysis.isDeleted || status !== APPROVED_ENTRY_KEY))
      throw reject(
        `"${analysis.name}" is not an Approved Test Template — only Approved templates can be added.`
      );

    row.analysisId = analysis.id;
    row.analysisName = analysis.name;
    row.componentName = component.name ?? component.componentId;
    const label = `"${analysis.name} / ${row.componentName}"`;

    const type = text(component.type);
    if (!(COMPONENT_TYPES as readonly string[]).includes(type)) continue;

    const keep = new Set(LIMITS_BY_TYPE[type] ?? []);
    for (const field of LIMIT_FIELDS) if (!keep.has(field)) row[field] = null;

    if (type === "VALUE" || type === "CALCULATION") {
      for (const field of ["min", "max"]) {
        if (text(row[field]) && Number.isNaN(Number(row[field])))
          throw reject(
            `${label}: ${field === "min" ? "Min" : "Max"} must be a number.`
          );
      }
      if (text(row.min) && text(row.max) && Number(row.min) > Number(row.max))
        throw reject(`${label}: Min can't be greater than Max.`);
    }

    if (
      type === "LIST" &&
      text(row.phrase) &&
      !validAnswers.has(`${text(component.list)}|${text(row.phrase)}`)
    )
      throw reject(`${label}: the acceptable answer isn't in that List.`);

    if (
      type === "BOOLEAN" &&
      text(row.boolean) &&
      !["true", "false"].includes(text(row.boolean))
    )
      throw reject(`${label}: pick the expected answer.`);
  }
};
