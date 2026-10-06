import { QueryInterface, QueryTypes } from "sequelize";
import { randomUUID } from "crypto";
import { UNIT_PHRASE, phraseEntryKey } from "../configs/pick-list-units";

/** Creates the system UNIT pick list the Stock Item `Unit` dropdown reads. Idempotent —
 * a DB already seeded via `seed-phrases` just gets any missing values. */
export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;

  const existing = await db.query<{ id: string }>(
    `SELECT id FROM lims_phrases WHERE phrase = :phrase`,
    { replacements: { phrase: UNIT_PHRASE.phrase }, type: QueryTypes.SELECT }
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
          phrase: UNIT_PHRASE.phrase,
          name: UNIT_PHRASE.name,
          description: UNIT_PHRASE.description
        }
      }
    );
  }

  for (const value of UNIT_PHRASE.entries) {
    await db.query(
      `INSERT INTO lims_phrase_entries (id, phrase_id, phrase_entry_id, name, created_at, updated_at)
       VALUES (:id, :phraseId, :key, :name, NOW(), NOW())
       ON CONFLICT (phrase_id, phrase_entry_id) DO NOTHING`,
      {
        replacements: {
          id: randomUUID(),
          phraseId,
          key: phraseEntryKey(UNIT_PHRASE.phrase, value),
          name: value
        }
      }
    );
  }
};
