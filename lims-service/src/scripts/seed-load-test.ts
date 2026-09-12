/**
 * Load-test seeding: bulk-inserts N samples (default 5000) into the Demo Lab
 * group via raw SQL for speed. Tagged with a LOADTEST- prefix so they're
 * trivially identifiable and can be wiped with cleanup-load-test.ts.
 *
 * Local dev only — never point this at a shared/remote database.
 *
 *   npx ts-node src/scripts/seed-load-test.ts [count] [startAt]
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { sequelize } from "../configs/db.sequelize";

const COUNT = parseInt(process.argv[2] ?? "5000", 10);
const START_AT = parseInt(process.argv[3] ?? "0", 10);
const BATCH_SIZE = 500;
const DEMO_GROUP_ID = "DEMO_LAB";
const STATUSES = ["Open", "In Progress", "Completed", "Cancelled"];

const run = async () => {
  await sequelize.authenticate();

  const [[demoGroup]]: any = await sequelize.query(
    `SELECT id FROM lims_groups WHERE group_id = :groupId`,
    { replacements: { groupId: DEMO_GROUP_ID } }
  );
  if (!demoGroup) {
    throw new Error("Demo Lab group not found — run seed-demo-data.ts first.");
  }
  const groupId = demoGroup.id;

  const [lots]: any = await sequelize.query(`SELECT id FROM lims_lots LIMIT 5`);
  if (!lots.length) throw new Error("No lots found — run seed-demo-data-2.ts first.");

  const now = new Date().toISOString();
  let inserted = 0;

  for (let batchStart = 0; batchStart < COUNT; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, COUNT);
    const values: string[] = [];
    const replacements: Record<string, any> = {};

    for (let i = batchStart; i < batchEnd; i++) {
      const n = START_AT + i + 1;
      const lot = lots[i % lots.length];
      const status = STATUSES[i % STATUSES.length];
      values.push(
        `(:id${i}, :sampleId${i}, :idNumeric${i}, :sampleName${i}, :lotId${i}, :status${i}, :groupId${i}, false, :now${i}, :now${i})`
      );
      replacements[`id${i}`] = randomUUID();
      replacements[`sampleId${i}`] = `LOADTEST-${String(n).padStart(6, "0")}`;
      replacements[`idNumeric${i}`] = n;
      replacements[`sampleName${i}`] = `Load Test Sample ${n}`;
      replacements[`lotId${i}`] = lot.id;
      replacements[`status${i}`] = status;
      replacements[`groupId${i}`] = groupId;
      replacements[`now${i}`] = now;
    }

    await sequelize.query(
      `INSERT INTO lims_samples (id, sample_id, id_numeric, sample_name, lot_id, status, group_id, is_deleted, created_at, updated_at)
       VALUES ${values.join(",")}`,
      { replacements }
    );
    inserted += batchEnd - batchStart;
    process.stdout.write(`\rInserted ${inserted}/${COUNT}`);
  }

  console.log(`\nDone: inserted ${inserted} samples tagged LOADTEST-######.`);
  await sequelize.close();
};

run().catch((error) => {
  console.error("Load-test seed failed:", error);
  process.exit(1);
});
