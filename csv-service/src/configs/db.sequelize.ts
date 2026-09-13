import { Sequelize } from "sequelize";
import ENV from "../utils/environment";

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

// Primary CSV Database Connection
export const sequelize = new Sequelize(
  sanitizePgUri(ENV.CSV_POSTGRES_URI) ||
    "postgres://postgres:postgres@localhost:5433/csv-service",
  {
    dialect: "postgres",
    logging: false,
    dialectOptions: isLocalPostgres(ENV.CSV_POSTGRES_URI)
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

// Secondary Auth Database Connection (Read-only reference)
export const authSequelize = new Sequelize(
  sanitizePgUri(ENV.AUTH_POSTGRES_URI) ||
    "postgres://postgres:postgres@localhost:5433/auth-service",
  {
    dialect: "postgres",
    logging: false,
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

export const connectDB = async (retries = 5, delayMs = 3000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log("csv-service database (PostgreSQL) connected successfully!");

      const { registerAssociations } = await import("../models/associations");
      registerAssociations();

      await authSequelize.authenticate();
      console.log("auth-service secondary DB connected successfully!");
      return;
    } catch (error) {
      console.error(
        `PostgreSQL connection attempt ${attempt}/${retries} failed in csv-service:`,
        error
      );
      if (attempt === retries) {
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};
