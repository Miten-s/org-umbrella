import dotenv from "dotenv";

dotenv.config();

const envConfig = process.env;

const ENV = {
  PORT: envConfig.PORT,
  MONGO_URI: envConfig.MONGO_URI,
  JWT_SECRET: envConfig.JWT_SECRET,
  CORS_ORIGINS: envConfig.CORS_ORIGINS
};

export default ENV;
