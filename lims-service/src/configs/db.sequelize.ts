import { Sequelize } from "sequelize";
import ENV from "../utils/environment";

// Main LIMS database connection.
export const sequelize = new Sequelize(
  ENV.LIMS_POSTGRES_URI ||
    "postgres://postgres:postgres@localhost:5433/lims_service_db",
  {
    dialect: "postgres",
    logging: ENV.NODE_ENV === "development" ? (msg) => console.log(msg) : false,
    dialectOptions:{
      ssl: {
        require: false,
      }
    },
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
  }
);

// Secondary auth database — read-only reference for resolving platform users
// onto LIMS records (LIMS never creates users, only grants access — see
// LIMS_BACKEND_SPEC.md §D2).
export const authSequelize = new Sequelize(
  ENV.AUTH_POSTGRES_URI ||
    "postgres://postgres:postgres@localhost:5433/umbrella_auth_db",
  {
    dialect: "postgres",
    logging: ENV.NODE_ENV === "development" ? (msg) => console.log(msg) : false,
    dialectOptions: ENV.AUTH_POSTGRES_URI?.includes("sslmode=require")
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      timestamps: true
    }
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("lims_service_db (PostgreSQL) connected successfully!");

    // Associations are registered once, here, rather than at module load —
    // they are circular by nature, so import order would otherwise matter.
    const { registerAssociations } = await import("../models/associations");
    registerAssociations();

    // Automatically run migrations on connection.
    // const { migrations, runMigrations } = await import("../migrations/index");
    // await runMigrations(sequelize, migrations);

    // Mirror the code-defined permission vocabulary into lims_permissions so
    // the catalogue can never describe permissions the code doesn't enforce.
    const { seedPermissions } = await import("../services/permission.service");
    await seedPermissions();

    // Warn if a pick list the UI reads is missing or empty. Not seeded
    // automatically: the values are a lab's own configuration, so overwriting
    // them on every boot would undo their edits.
    const { reportPhraseHealth } = await import("../services/phrase-health.service");
    await reportPhraseHealth();

    await authSequelize.authenticate();
    console.log("umbrella_auth_db secondary connection connected successfully!");
  } catch (error) {
    console.error("PostgreSQL connection/migration error in lims-service:", error);
    process.exit(1);
  }
};
