import { Sequelize, QueryInterface } from "sequelize";

export interface Migration {
  name: string;
  up: (queryInterface: QueryInterface) => Promise<void>;
}

export const runMigrations = async (sequelize: Sequelize, migrations: Migration[]): Promise<void> => {
  const queryInterface = sequelize.getQueryInterface();

  // Ensure sequelize_meta table exists
  await queryInterface.createTable("sequelize_meta", {
    name: {
      type: "VARCHAR(255)",
      primaryKey: true,
      allowNull: false
    }
  });

  const [executedMigrations] = await sequelize.query("SELECT name FROM sequelize_meta");
  const executedNames = new Set((executedMigrations as any[]).map((m) => m.name));

  for (const migration of migrations) {
    if (!executedNames.has(migration.name)) {
      console.log(`Running migration: ${migration.name}...`);
      await migration.up(queryInterface);
      await sequelize.query("INSERT INTO sequelize_meta (name) VALUES (:name)", {
        replacements: { name: migration.name }
      });
      console.log(`Migration ${migration.name} completed successfully.`);
    }
  }
  console.log("All migrations checked and up-to-date!");
};
