import dotenv from "dotenv";

dotenv.config();

const envConfig = process.env;

const ENV = {
  PORT: envConfig.PORT,
  MONGO_URI: envConfig.GXP_MONGO_URI,
  JWT_SECRET: envConfig.JWT_SECRET,
  INTERNAL_API_KEY: envConfig.INTERNAL_API_KEY,
  BACKEND_INTERNAL_URL: envConfig.BACKEND_INTERNAL_URL,
  CORS_ORIGINS: envConfig.CORS_ORIGINS,
  REDIS_SERVER_URL: envConfig.REDIS_SERVER_URL,
  REDIS_SERVER_PASSWORD: envConfig.REDIS_SERVER_PASSWORD,
  NODE_ENV: envConfig.NODE_ENV
};

export default ENV;
