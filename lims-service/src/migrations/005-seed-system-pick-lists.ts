import { QueryInterface, QueryTypes } from "sequelize";
import { randomUUID } from "crypto";
import { phraseEntryKey } from "../configs/pick-list-units";
import { SYSTEM_PHRASES } from "../configs/system-pick-lists";

/** Creates every system pick list and its starting values. Insert-only, so values a lab
 * renamed or added are left alone and an already-seeded DB just gets what is missing. */
export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;

  for (const seed of SYSTEM_PHRASES) {
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM lims_phrases WHERE phrase = :phrase`,
      { replacements: { phrase: seed.phrase }, type: QueryTypes.SELECT }
    );

    let phraseId = existing[0]?.id;
    if (!phraseId) {
      phraseId = randomUUID();
      await db.query(
        `INSERT INTO lims_phrases (id, phrase, name, description, group_id, is_system, is_deleted, created_at, updated_at)
         VALUES (:id, :phrase, :name, :description, NULL, true, false, NOW(), NOW())`,
        {
          replacements: {
            id: phraseId,
            phrase: seed.phrase,
            name: seed.name,
            description: seed.description
          }
        }
      );
    }

    for (const value of seed.entries) {
      await db.query(
        `INSERT INTO lims_phrase_entries (id, phrase_id, phrase_entry_id, name, created_at, updated_at)
         VALUES (:id, :phraseId, :key, :name, NOW(), NOW())
         ON CONFLICT (phrase_id, phrase_entry_id) DO NOTHING`,
        {
          replacements: {
            id: randomUUID(),
            phraseId,
            key: phraseEntryKey(seed.phrase, value),
            name: value
          }
        }
      );
    }
  }
};
