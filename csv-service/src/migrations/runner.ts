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

  await queryInterface
    .createTable("sequelize_meta", {
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      }
    })
    .catch(() => {});

  const applied: string[] = await sequelize
    .query("SELECT name FROM sequelize_meta", { type: "SELECT" })
    .then((rows: any) => rows.map((r: any) => r.name));

  console.log(`[csv-service] Found ${applied.length} applied migrations.`);

  for (const migration of migrations) {
    if (applied.includes(migration.name)) {
      continue;
    }

    console.log(`[csv-service] Running migration: ${migration.name}...`);
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
      console.log(
        `[csv-service] Migration ${migration.name} completed successfully.`
      );
    } catch (error) {
      await transaction.rollback();
      console.error(
        `[csv-service] Migration ${migration.name} failed and rolled back.`,
        error
      );
      throw error;
    }
  }

  console.log("[csv-service] All migrations checked and up-to-date!");
};

export const checkMigrations = async (
  sequelize: Sequelize,
  migrations: Migration[]
) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface
    .createTable("sequelize_meta", {
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      }
    })
    .catch(() => {});

  const applied: string[] = await sequelize
    .query("SELECT name FROM sequelize_meta", { type: "SELECT" })
    .then((rows: any) => rows.map((r: any) => r.name));

  const pending = migrations.filter((m) => !applied.includes(m.name));

  if (pending.length > 0) {
    throw new Error(
      `[csv-service] Database schema OUT OF SYNC! Pending migrations: ${pending.map((m) => m.name).join(", ")}`
    );
  }

  console.log("[csv-service] Database schema fully in sync!");
  return true;
};
