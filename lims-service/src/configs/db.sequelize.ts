import { Sequelize } from "sequelize";
import ENV from "../utils/environment";

// Main LIMS Database Connection
export const sequelize = new Sequelize(
  ENV.LIMS_POSTGRES_URI || "postgres://postgres:postgres@localhost:5433/lims_db",
  {
    dialect: "postgres",
    logging: ENV.NODE_ENV === "development" ? (msg) => console.log(msg) : false,
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

// Secondary Auth Database Connection (Read-only reference)
export const authSequelize = new Sequelize(
  ENV.AUTH_POSTGRES_URI || "postgres://postgres:postgres@localhost:5433/umbrella_auth_db",
  {
    dialect: "postgres",
    logging: ENV.NODE_ENV === "development" ? (msg) => console.log(msg) : false,
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
    console.log("lims_db (PostgreSQL) connected successfully!");

    // Run migrations on startup
    const { migrations, runMigrations } = await import("../migrations/index");
    await runMigrations(sequelize, migrations);

    await authSequelize.authenticate();
    console.log("umbrella_auth_db secondary connection connected successfully!");

    // Run seeders
    const { seedSystemPhrases } = await import("../scripts/seed-phrases");
    await seedSystemPhrases();
  } catch (error) {
    console.error("LIMS PostgreSQL connection/migration error:", error);
    process.exit(1);
  }
};
