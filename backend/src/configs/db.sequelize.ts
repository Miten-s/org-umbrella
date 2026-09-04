import { Sequelize } from "sequelize";

const postgresUri = process.env.AUTH_POSTGRES_URI;

// Managed providers (Neon, Supabase) require SSL; local dev doesn't.
// NOTE: don't detect this via `?sslmode=require` in the URI — pg's own
// connection-string parser then takes over SSL config and ignores the
// `ssl` object below entirely, forcing full cert verification and failing
// against Supabase's chain with SELF_SIGNED_CERT_IN_CHAIN.
const isLocalPostgres = (uri?: string) => {
  if (!uri) return true;
  if (uri.includes("sslmode=require") || uri.includes("supabase") || uri.includes("neon.tech") || uri.includes("rds.amazonaws.com")) {
    return false;
  }
  return /localhost|127\.0\.0\.1|postgres/.test(uri) || !uri.includes("ssl");
};

export const sequelize = new Sequelize(postgresUri || "postgres://postgres:postgres@localhost:5433/umbrella_auth_db", {
  dialect: "postgres",
  logging: (msg) => console.log(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: isLocalPostgres(postgresUri)
    ? undefined
    : { ssl: { require: true, rejectUnauthorized: false } },
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
