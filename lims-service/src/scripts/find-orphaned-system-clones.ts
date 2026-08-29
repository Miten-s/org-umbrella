/**
 * READ-ONLY. Finds Pick Lists (Phrases) that are marked `isSystem: true`
 * but whose code carries a "-(N)" clone suffix — no real seeded system
 * list is ever named that way, so every match here is an artifact of the
 * pre-fix Copy bug: `bulkDuplicate` used to copy `isSystem` onto the clone,
 * making it permanently stuck (un-removable AND un-renameable, since its
 * own suffixed code also fails the CAPS_NUMBERS_UNDERSCORES format the
 * system list was seeded with).
 *
 * Prints what it finds and does not modify anything. See the companion
 * `fix-orphaned-system-clones.ts` to actually correct these rows once
 * you've confirmed the list below is right.
 *
 *   npx ts-node src/scripts/find-orphaned-system-clones.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import Phrase from "../models/phrase.model";

const CLONE_SUFFIX = /-\(\d+\)$/;

const run = async () => {
  // `isDeleted` is a plain boolean column here, not Sequelize `paranoid`
  // mode — a bare findAll already returns every row, soft-deleted or not.
  const all = await Phrase.findAll();
  const suspects = all.filter((row) => row.isSystem && CLONE_SUFFIX.test(row.phrase));

  if (!suspects.length) {
    console.log("No orphaned system-flagged clones found.");
    return;
  }

  console.log(`Found ${suspects.length} suspect row(s):\n`);
  for (const row of suspects) {
    console.log(
      `  id=${row.id}  phrase="${row.phrase}"  name="${row.name}"  ` +
        `isSystem=${row.isSystem}  isDeleted=${row.isDeleted}`
    );
  }
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sequelize.close());
