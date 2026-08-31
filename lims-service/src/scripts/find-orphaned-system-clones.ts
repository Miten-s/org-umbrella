/** READ-ONLY. Finds Pick Lists marked `isSystem: true` with a "-(N)" clone suffix — an
 * artifact of the pre-fix Copy bug. See `fix-orphaned-system-clones.ts` to correct them. */
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
