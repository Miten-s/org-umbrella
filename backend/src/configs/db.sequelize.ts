import { Sequelize } from "sequelize";

const postgresUri = process.env.AUTH_POSTGRES_URI;

export const sequelize = new Sequelize(postgresUri || "postgres://postgres:postgres@localhost:5433/umbrella_auth_db", {
  dialect: "postgres",
  logging: (msg) => console.log(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    timestamps: true
  }
});

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("umbrella_auth_db (PostgreSQL) connected successfully!");
    
    // Automatically run migrations on connection
    const { migrations, runMigrations } = await import("../migrations/index");
    await runMigrations(sequelize, migrations);
  } catch (error) {
    console.error("PostgreSQL connection/migration error:", error);
    process.exit(1);
  }
};
