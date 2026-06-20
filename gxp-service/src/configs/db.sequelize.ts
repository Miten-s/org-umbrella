import { Sequelize } from "sequelize";

const gxpPostgresUri = process.env.GXP_POSTGRES_URI;
const authPostgresUri = process.env.AUTH_POSTGRES_URI;

// Main GxP Database Connection
export const sequelize = new Sequelize(gxpPostgresUri || "postgres://postgres:postgres@localhost:5433/gxp_workflow_db", {
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

// Secondary Auth Database Connection (Read-only reference)
export const authSequelize = new Sequelize(authPostgresUri || "postgres://postgres:postgres@localhost:5433/umbrella_auth_db", {
  dialect: "postgres",
  logging: (msg) => console.log(msg),
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
});

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("gxp_workflow_db (PostgreSQL) connected successfully!");
    
    // Automatically run migrations on connection
    const { migrations, runMigrations } = await import("../migrations/index");
    await runMigrations(sequelize, migrations);

    await authSequelize.authenticate();
    console.log("umbrella_auth_db secondary connection connected successfully!");
  } catch (error) {
    console.error("PostgreSQL connection/migration error in gxp-service:", error);
    process.exit(1);
  }
};
