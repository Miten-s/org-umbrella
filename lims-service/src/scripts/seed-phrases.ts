/** Seeds the system pick lists every relational dropdown reads from (spec: "pre created,
 * can't be deleted"). Codes must match `PHRASE_CODES` in LimsPhrase.api.ts. Idempotent. */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import { registerAssociations } from "../models/associations";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import { phraseEntryKey } from "../configs/pick-list-units";
import { SYSTEM_PHRASES } from "../configs/system-pick-lists";

const run = async () => {
  await sequelize.authenticate();
  registerAssociations();

  let createdPhrases = 0;
  let createdEntries = 0;

  for (const seed of SYSTEM_PHRASES) {
    const [phrase, isNew] = await Phrase.findOrCreate({
      where: { phrase: seed.phrase },
      defaults: {
        phrase: seed.phrase,
        name: seed.name,
        description: seed.description,
        // Marks it undeletable — the spec's "can't be deleted".
        isSystem: true,
        // Global reference data: visible to every group.
        groupId: null
      } as any
    });

    if (isNew) createdPhrases += 1;

    for (const value of seed.entries) {
      const [, entryIsNew] = await PhraseEntry.findOrCreate({
        where: {
          phraseId: phrase.id,
          phraseEntryId: phraseEntryKey(seed.phrase, value)
        },
        defaults: {
          phraseId: phrase.id,
          phraseEntryId: phraseEntryKey(seed.phrase, value),
          name: value
        } as any
      });
      if (entryIsNew) createdEntries += 1;
    }
  }

  console.log(
    `Pick lists seeded: ${SYSTEM_PHRASES.length} checked, ` +
      `${createdPhrases} created, ${createdEntries} values added.`
  );

  await sequelize.close();
};

run().catch((error) => {
  console.error("Seeding pick lists failed:", error);
  process.exit(1);
});
