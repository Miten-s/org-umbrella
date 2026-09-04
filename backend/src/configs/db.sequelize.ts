import { Sequelize } from "sequelize";

const postgresUri = process.env.AUTH_POSTGRES_URI;

// Managed providers (Neon, Supabase) require SSL; local dev doesn't.
// NOTE: don't detect this via `?sslmode=require` in the URI — pg's own
// connection-string parser then takes over SSL config and ignores the
// `ssl` object below entirely, forcing full cert verification and failing
// against Supabase's chain with SELF_SIGNED_CERT_IN_CHAIN.
const isLocalPostgres = (uri?: string) => {
  if (!uri) return true;
  if (/localhost|127\.0\.0\.1|postgres/.test(uri)) {
    return true;
};

  if (!uri) return uri;
  if (isLocalPostgres(uri)) {
    return uri.replace(/[\?&]sslmode=[^&]+/gi, "").replace(/[\?&]ssl=[^&]+/gi, "");
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
