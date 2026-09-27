import { Op, Transaction } from "sequelize";
import Analysis from "../models/analysis.model";
import PhraseEntry from "../models/phrase-entry.model";
import { APPROVED_ENTRY_KEY } from "../utils/approval-status";

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

/** A list of Test Templates attached to something (Sample Template): each must exist, appear
 * once, and — if newly added — be Approved. One already attached that was superseded later
 * doesn't block unrelated edits. */
export const assertTemplatesAssignable = async (
  ids: string[],
  alreadyAttached: Set<string>,
  transaction: Transaction
) => {
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
      throw reject(`"${analysis.name}" is added more than once.`);
    seen.add(id);
    const approved =
      (analysis as any).approvalStatus?.phraseEntryId === APPROVED_ENTRY_KEY;
    if (!alreadyAttached.has(id) && !approved)
      throw reject(
        `"${analysis.name}" is not Approved — only Approved Test Templates can be added.`
      );
  }
};
