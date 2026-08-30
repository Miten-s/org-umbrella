/**
 * Un-sticks the 6 rows found by `find-orphaned-system-clones.ts` — clones of
 * a system Pick List that wrongly inherited `isSystem: true` from the
 * pre-fix Copy bug, making them permanently un-removable AND un-renameable.
 *
 * Sets `isSystem: false` ONLY on these exact ids (hardcoded from the
 * confirmed read-only scan, not re-derived from the suffix pattern at write
 * time) — nothing else about the row changes. Once this runs, each behaves
 * like any ordinary user-created pick list: editable code/name, removable
 * via the normal UI action. Reversible (just flip the flag back) if this
 * turns out to be wrong for one of them.
 *
 *   npx ts-node src/scripts/fix-orphaned-system-clones.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import Phrase from "../models/phrase.model";

const TARGET_IDS = [
  "3c64b870-2aa8-40da-ae27-a18fcf7d8e35", // CALIBRATION_TYPE-(1)
  "3b3a75d4-badc-4cb8-8c40-8944f6738445", // INSTRUMENT_STATUS-(1)
  "0e2bb9b3-3a0a-4498-ac00-e4c928d60ac2", // INSTRUMENT_TYPE-(1)
  "d87548ca-5b30-41a8-8065-85dc3d190446", // LOCATION_TYPE-(1)
  "3c161f27-b0fe-416c-a57a-a90264d7a59f", // STOCK_TYPE-(1)
  "35733be5-9a02-4e6d-8d3a-7a1931243bae" // PARAMETER_TYPE-(1)
];

const run = async () => {
  await sequelize.transaction(async (transaction) => {
    const rows = await Phrase.findAll({ where: { id: TARGET_IDS }, transaction });

    if (rows.length !== TARGET_IDS.length) {
      throw new Error(
        `Expected ${TARGET_IDS.length} rows, found ${rows.length} — aborting without changing anything.`
      );
    }
    const notSystem = rows.filter((r) => !r.isSystem);
    if (notSystem.length) {
      throw new Error(
        `${notSystem.length} of the target rows are already isSystem=false — ` +
          "aborting so nothing unexpected gets touched. Re-run find-orphaned-system-clones.ts first."
      );
    }

    for (const row of rows) {
      await row.update({ isSystem: false }, { transaction });
      console.log(`isSystem -> false: "${row.phrase}"`);
    }
  });

  console.log(`\nDone — ${TARGET_IDS.length} row(s) updated.`);
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sequelize.close());
