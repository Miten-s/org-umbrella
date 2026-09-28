import { Sequelize } from "sequelize";

const gxpPostgresUri = process.env.GXP_POSTGRES_URI;
const authPostgresUri = process.env.AUTH_POSTGRES_URI;

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
  return !(
    uri.includes("sslmode=require") ||
    uri.includes("supabase") ||
    uri.includes("neon.tech") ||
    uri.includes("rds.amazonaws.com")
  );
};

const sanitizePgUri = (uri?: string) => {
  if (!uri) return uri;
  if (isLocalPostgres(uri)) {
    return uri
      .replace(/[\?&]sslmode=[^&]+/gi, "")
      .replace(/[\?&]ssl=[^&]+/gi, "");
  }
  return uri;
};

// Main GxP Database Connection
export const sequelize = new Sequelize(
  sanitizePgUri(gxpPostgresUri) ||
    "postgres://postgres:postgres@localhost:5433/gxp_workflow_db",
  {
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: isLocalPostgres(gxpPostgresUri)
      ? undefined
      : { ssl: { require: true, rejectUnauthorized: false } },
    define: {
      underscored: true,
      timestamps: true
    }
  }
);

// Secondary Auth Database Connection (Read-only reference)
export const authSequelize = new Sequelize(
  sanitizePgUri(authPostgresUri) ||
    "postgres://postgres:postgres@localhost:5433/umbrella_auth_db",
  {
    dialect: "postgres",
    logging: false,
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
  }
);

export const connectDB = async (retries = 5, delayMs = 3000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log("gxp_workflow_db (PostgreSQL) connected successfully!");

      await authSequelize.authenticate();
      console.log(
        "umbrella_auth_db secondary connection connected successfully!"
      );
      return;
    } catch (error) {
      console.error(
        `PostgreSQL connection attempt ${attempt}/${retries} failed in gxp-service:`,
        error
      );
      if (attempt === retries) {
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};
