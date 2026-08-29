import { Sequelize } from "sequelize";

const gxpPostgresUri = process.env.GXP_POSTGRES_URI;
const authPostgresUri = process.env.AUTH_POSTGRES_URI;

// Managed providers (Neon, Supabase) require SSL; local dev doesn't.
// NOTE: don't detect this via `?sslmode=require` in the URI — pg's own
// connection-string parser then takes over SSL config and ignores the
// `ssl` object below entirely, forcing full cert verification and failing
// against Supabase's chain with SELF_SIGNED_CERT_IN_CHAIN.
const isLocalPostgres = (uri?: string) => !uri || /localhost|127\.0\.0\.1/.test(uri);

// Main GxP Database Connection
export const sequelize = new Sequelize(gxpPostgresUri || "postgres://postgres:postgres@localhost:5433/gxp_workflow_db", {
  dialect: "postgres",
  logging: (msg) => console.log(msg),
  dialectOptions: isLocalPostgres(gxpPostgresUri)
    ? undefined
    : { ssl: { require: true, rejectUnauthorized: false } },
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
  dialectOptions: isLocalPostgres(authPostgresUri)
    ? undefined
    : { ssl: { require: true, rejectUnauthorized: false } },
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
