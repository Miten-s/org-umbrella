import dotenv from "dotenv";
dotenv.config();

const envConfig = process.env;

const ENV = {
  PORT: envConfig.PORT,
  LIMS_POSTGRES_URI: envConfig.LIMS_POSTGRES_URI,
  AUTH_POSTGRES_URI: envConfig.AUTH_POSTGRES_URI,
  JWT_SECRET: envConfig.JWT_SECRET,
  CORS_ORIGINS: envConfig.CORS_ORIGINS,
  NODE_ENV: envConfig.NODE_ENV,
  KAFKA_BROKER: envConfig.KAFKA_BROKER,
  KAFKA_CLIENT_ID: envConfig.KAFKA_CLIENT_ID,
  KAFKA_GROUP_ID: envConfig.KAFKA_GROUP_ID
};

export default ENV;
