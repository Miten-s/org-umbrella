import { QueryInterface, DataTypes, Sequelize } from "sequelize";

export interface Migration {
  name: string;
  up: (queryInterface: QueryInterface, DataTypes: any) => Promise<void>;
}

export const runMigrations = async (sequelize: Sequelize, migrations: Migration[]) => {
  const queryInterface = sequelize.getQueryInterface();

  // 1. Create meta table if it doesn't exist
  await queryInterface.createTable("sequelize_meta", {
    name: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    }
  }).catch(() => {});

  // 2. Fetch applied migrations
  const applied: string[] = await sequelize.query(
    "SELECT name FROM sequelize_meta",
    { type: "SELECT" }
  ).then((rows: any) => rows.map((r: any) => r.name));

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
      console.error(`Migration ${migration.name} failed and rolled back.`, error);
      throw error;
    }
  }

  console.log("All migrations checked and up-to-date!");
};
