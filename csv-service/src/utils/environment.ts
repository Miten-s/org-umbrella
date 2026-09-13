import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 9003,
  NODE_ENV: process.env.NODE_ENV || "development",
  CSV_POSTGRES_URI:
    process.env.CSV_POSTGRES_URI ||
    "postgres://postgres:postgres@localhost:5433/csv-service",
  AUTH_POSTGRES_URI:
    process.env.AUTH_POSTGRES_URI ||
    "postgres://postgres:postgres@localhost:5433/auth-service",
  JWT_SECRET: process.env.JWT_SECRET || "default-secret-key-change-in-prod",
  CORS_ORIGINS:
    process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:4173",
  KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9092",
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "csv-service",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "csv-group",
  REDIS_SERVER_URL: process.env.REDIS_SERVER_URL || "redis://localhost:6379",
  REDIS_SERVER_PASSWORD: process.env.REDIS_SERVER_PASSWORD || ""
};

export default ENV;
