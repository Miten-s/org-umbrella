import { Op, WhereOptions } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import { phraseEntryKey } from "../configs/pick-list-units";

export const APPROVED_ENTRY_KEY = phraseEntryKey("APPROVAL_STATUS", "Approved");

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
