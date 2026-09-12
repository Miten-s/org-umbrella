import { createClient } from "redis";
import ENV from "../utils/environment";

const redisClient = createClient({
  url: ENV.REDIS_SERVER_URL,
  password: ENV.REDIS_SERVER_PASSWORD // Use the same password set in redis.conf
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export const connectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) return;
  try {
    await redisClient.connect();
    console.log("Connected to Redis with authentication");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
};

// Cache methods
export const cacheResponse = async ({
  key,
  value,
  ttl = 3600
}: {
  key: string;
  value: any;
  ttl?: number;
}): Promise<void> => {
  try {
    await connectRedis();
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    console.log(`Cached response for key: ${key}`);
  } catch (error) {
    console.error("Error caching response:", error);
  }
};

export const getCachedResponse = async (key: string): Promise<any | null> => {
  try {
    await connectRedis();
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error fetching cached response:", error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await connectRedis();
    await redisClient.del(key);
    console.log(`Deleted cache for key: ${key}`);
  } catch (error) {
    console.error("Error deleting cache:", error);
  }
};

export const deleteCacheByPrefix = async (prefix: string): Promise<void> => {
  try {
    await connectRedis();
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Deleted ${keys.length} cache keys with prefix: ${prefix}`);
    }
  } catch (error) {
    console.error("Error deleting cache by prefix:", error);
  }
};

export default redisClient;
