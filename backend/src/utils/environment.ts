import dotenv from "dotenv";

dotenv.config();

const envConfig = process.env;

const ENV = {
  PORT: envConfig.PORT,
  MONGO_URI: envConfig.MONGO_URI,
  JWT_SECRET: envConfig.JWT_SECRET,
  CORS_ORIGINS: envConfig.CORS_ORIGINS,
  REDIS_SERVER_URL: envConfig.REDIS_SERVER_URL,
  REDIS_SERVER_PASSWORD: envConfig.REDIS_SERVER_PASSWORD,
  NODE_ENV: envConfig.NODE_ENV,
  // Shared secret for service-to-service calls (lims-service/gxp-service -> backend's
  // internal permissions API). Not a user credential — never exposed to the frontend.
  INTERNAL_API_KEY: envConfig.INTERNAL_API_KEY
};

export default ENV;
