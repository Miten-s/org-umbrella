/**
 * READ-ONLY. Finds Lab Groups with `ownedBy` set but `ownedByName` blank —
 * `postFormat` (group.routes.ts) nests these into `{ id, name: "" }`, which
 * is exactly the "raw UUID instead of a name" symptom in the Owned By
 * picker. `resolveOwnerName` (the same file) backfills this correctly on
 * every write going forward; this just finds rows written before that
 * existed (or inserted directly by a seed script, bypassing the hook).
 *
 *   npx ts-node src/scripts/find-groups-missing-owner-name.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import Group from "../models/group.model";

const run = async () => {
  const all = await Group.findAll();
  const affected = all.filter(
    (row) => row.ownedBy && (!row.ownedByName || !row.ownedByName.trim())
  );

  if (!affected.length) {
    console.log("No groups with a missing owner name found.");
    return;
  }

  console.log(`Found ${affected.length} affected row(s):\n`);
  for (const row of affected) {
    console.log(`  id=${row.id}  groupId="${row.groupId}"  ownedBy=${row.ownedBy}`);
  }
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sequelize.close());
