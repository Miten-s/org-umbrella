/**
 * Backfills `ownedByName` for the Lab Group row(s) found by
 * `find-groups-missing-owner-name.ts` — same lookup `resolveOwnerName`
 * (group.routes.ts) already does on every write, applied once here for
 * whatever was already in the table before that existed.
 *
 * Targets ONLY the exact id confirmed by the read-only scan — not a live
 * re-query at write time — so there's no chance of drift.
 *
 *   npx ts-node src/scripts/fix-groups-missing-owner-name.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import Group from "../models/group.model";
import LimsUser from "../models/lims-user.model";

const TARGET_IDS = [
  "bd274134-9c1d-441e-b724-96b42fc233f7" // LIMS_QA_Group1
];

const run = async () => {
  await sequelize.transaction(async (transaction) => {
    const rows = await Group.findAll({ where: { id: TARGET_IDS }, transaction });

    if (rows.length !== TARGET_IDS.length) {
      throw new Error(
        `Expected ${TARGET_IDS.length} rows, found ${rows.length} — aborting without changing anything.`
      );
    }

    for (const row of rows) {
      if (!row.ownedBy) {
        console.log(`skip "${row.groupId}" — ownedBy is now empty, nothing to backfill.`);
        continue;
      }
      const owner = await LimsUser.findByPk(row.ownedBy, { transaction });
      if (!owner) {
        console.log(`skip "${row.groupId}" — no LimsUser found for ownedBy=${row.ownedBy}.`);
        continue;
      }
      await row.update({ ownedByName: owner.userName ?? null }, { transaction });
      console.log(`"${row.groupId}": ownedByName -> "${owner.userName}"`);
    }
  });

  console.log("\nDone.");
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sequelize.close());
