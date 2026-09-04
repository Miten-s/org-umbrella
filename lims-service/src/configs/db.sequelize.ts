import { Sequelize } from "sequelize";
import ENV from "../utils/environment";

// Managed providers (Neon, Supabase) require SSL; local dev doesn't.
// NOTE: don't detect this via `?sslmode=require` in the URI — pg's own
// connection-string parser then takes over SSL config and ignores the
// `ssl` object below entirely, forcing full cert verification and failing
// against Supabase's chain with SELF_SIGNED_CERT_IN_CHAIN.
const isLocalPostgres = (uri?: string) => {
  if (!uri) return true;
  if (/localhost|127\.0\.0\.1|postgres/.test(uri)) {
    return true;
  }
  return !(uri.includes("sslmode=require") || uri.includes("supabase") || uri.includes("neon.tech") || uri.includes("rds.amazonaws.com"));
};

const sanitizePgUri = (uri?: string) => {
  if (!uri) return uri;
  if (isLocalPostgres(uri)) {
    return uri.replace(/[\?&]sslmode=[^&]+/gi, "").replace(/[\?&]ssl=[^&]+/gi, "");
  }
  return uri;
};

// Main LIMS database connection.
export const sequelize = new Sequelize(
  sanitizePgUri(ENV.LIMS_POSTGRES_URI) ||
    "postgres://postgres:postgres@localhost:5433/lims_service_db",
  {
    dialect: "postgres",
    logging: ENV.NODE_ENV === "development" ? (msg) => console.log(msg) : false,
    dialectOptions: isLocalPostgres(ENV.LIMS_POSTGRES_URI)
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
  }
);

// Secondary auth database — read-only reference for resolving platform users onto LIMS
// records (LIMS never creates users, only grants access).
export const authSequelize = new Sequelize(
  sanitizePgUri(ENV.AUTH_POSTGRES_URI) ||
    "postgres://postgres:postgres@localhost:5433/umbrella_auth_db",
  {
    dialect: "postgres",
    logging: ENV.NODE_ENV === "development" ? (msg) => console.log(msg) : false,
    dialectOptions: isLocalPostgres(ENV.AUTH_POSTGRES_URI)
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
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("lims_service_db (PostgreSQL) connected successfully!");

    // Registered once, here, not at module load — circular by nature, so import order would otherwise matter.
    const { registerAssociations } = await import("../models/associations");
    registerAssociations();

    // Automatically run migrations on connection.
    // const { migrations, runMigrations } = await import("../migrations/index");
    // await runMigrations(sequelize, migrations);

    // Mirror the code-defined permission vocabulary into lims_permissions so
    // the catalogue can never describe permissions the code doesn't enforce.
    const { seedPermissions } = await import("../services/permission.service");
    await seedPermissions();

    // Warn if a pick list is missing/empty; not auto-seeded, since values are a lab's own config.
    const { reportPhraseHealth } = await import("../services/phrase-health.service");
    await reportPhraseHealth();

    await authSequelize.authenticate();
    console.log("umbrella_auth_db secondary connection connected successfully!");
  } catch (error) {
    console.error("PostgreSQL connection/migration error in lims-service:", error);
    process.exit(1);
  }
};
