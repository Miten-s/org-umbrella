import { Op, Transaction, WhereOptions } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { phraseEntryKey } from "../configs/pick-list-units";
import PhraseEntry from "../models/phrase-entry.model";

export const APPROVED_ENTRY_KEY = phraseEntryKey("APPROVAL_STATUS", "Approved");
export const DRAFT_ENTRY_KEY = phraseEntryKey("APPROVAL_STATUS", "Draft");

/** `approvalStatusId` IN the APPROVAL_STATUS entry whose name is `status` ("Approved"),
 * resolved in SQL so callers never need the phrase entry's UUID. */
export const approvalStatusWhere = (status: string): WhereOptions => ({
  approvalStatusId: {
    [Op.in]: sequelize.literal(
      `(SELECT e.id FROM lims_phrase_entries e
          JOIN lims_phrases p ON p.id = e.phrase_id
         WHERE p.phrase = 'APPROVAL_STATUS'
           AND e.phrase_entry_id = ${sequelize.escape(
             phraseEntryKey("APPROVAL_STATUS", status)
           )})`
    )
  }
});

/** New records start as Draft when the caller left Approval status empty. */
export const defaultToDraft = async (
  payload: Record<string, any>,
  transaction?: Transaction
) => {
  if (payload.approvalStatusId) return payload;
  const draft = await PhraseEntry.findOne({
    where: { phraseEntryId: DRAFT_ENTRY_KEY },
    attributes: ["id"],
    transaction
  });
  return draft ? { ...payload, approvalStatusId: draft.id } : payload;
};
