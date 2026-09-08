import { QueryInterface, DataTypes, Sequelize } from "sequelize";

export interface Migration {
  name: string;
  up: (queryInterface: QueryInterface, DataTypes: any) => Promise<void>;
}

export const runMigrations = async (
  sequelize: Sequelize,
  migrations: Migration[]
) => {
  const queryInterface = sequelize.getQueryInterface();

  // 1. Create meta table if it doesn't exist
  await queryInterface
    .createTable("sequelize_meta", {
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      }
    })
    .catch(() => {});

  // 2. Fetch applied migrations
  const applied: string[] = await sequelize
    .query("SELECT name FROM sequelize_meta", { type: "SELECT" })
    .then((rows: any) => rows.map((r: any) => r.name));

  console.log(`Found ${applied.length} applied migrations.`);

  // 3. Run pending migrations
  for (const migration of migrations) {
    if (applied.includes(migration.name)) {
      continue;
    }

    console.log(`Running migration: ${migration.name}...`);
    const transaction = await sequelize.transaction();

    try {
      await migration.up(queryInterface, DataTypes);
      await sequelize.query(
        "INSERT INTO sequelize_meta (name) VALUES (:name)",
        {
          replacements: { name: migration.name },
          transaction
        }
      );
      await transaction.commit();
      console.log(`Migration ${migration.name} completed successfully.`);
    } catch (error) {
      await transaction.rollback();
      console.error(
        `Migration ${migration.name} failed and rolled back.`,
        error
      );
      throw error;
    }
  }

  console.log("All migrations checked and up-to-date!");
};

export const checkMigrations = async (
  sequelize: Sequelize,
  migrations: Migration[]
) => {
  const queryInterface = sequelize.getQueryInterface();

  // 1. Ensure meta table exists
  await queryInterface
    .createTable("sequelize_meta", {
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      }
    })
    .catch(() => {});

  // 2. Fetch applied migrations
  const applied: string[] = await sequelize
    .query("SELECT name FROM sequelize_meta", { type: "SELECT" })
    .then((rows: any) => rows.map((r: any) => r.name));

  const codeMigrationNames = migrations.map((m) => m.name);
  const pending = migrations.filter((m) => !applied.includes(m.name));
  const missingFromCode = applied.filter(
    (name) => !codeMigrationNames.includes(name)
  );

  console.log(`\n=== 🔍 DATABASE MIGRATION SYNC CHECK ===`);
  console.log(`Total migrations in code:      ${codeMigrationNames.length}`);
  console.log(`Applied migrations in DB:       ${applied.length}`);
  console.log(`Pending migrations to apply:   ${pending.length}`);

  let outOfSync = false;

  if (pending.length > 0) {
    console.error(
      `\n❌ [OUT OF SYNC] Found ${pending.length} pending migration(s) that have NOT been applied to the database:`
    );
    pending.forEach((m) => console.error(`   - ${m.name}`));
    outOfSync = true;
  }

  if (missingFromCode.length > 0) {
    console.warn(
      `\n⚠️ [WARNING] Found ${missingFromCode.length} applied migration(s) recorded in DB that no longer exist in code:`
    );
    missingFromCode.forEach((name) => console.warn(`   - ${name}`));
  }

  if (outOfSync) {
    throw new Error(
      `Database schema is OUT OF SYNC with code! Run 'npm run db:migrate' to apply pending migrations.`
    );
  }

  console.log(
    `\n✅ [IN SYNC] Database schema is fully up-to-date with code migrations.`
  );
  return true;
};
