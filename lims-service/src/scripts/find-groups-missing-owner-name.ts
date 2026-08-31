/** READ-ONLY. Finds Lab Groups with `ownedBy` set but `ownedByName` blank (pre-dating
 * `resolveOwnerName`'s backfill). `npx ts-node src/scripts/find-groups-missing-owner-name.ts` */
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
