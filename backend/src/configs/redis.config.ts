import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://localhost:6379",
  password: "your_secure_password" // Use the same password set in redis.conf
});

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis with authentication");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
})();

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
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    console.log(`Cached response for key: ${key}`);
  } catch (error) {
    console.error("Error caching response:", error);
  }
};

export const getCachedResponse = async (key: string): Promise<any | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error fetching cached response:", error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
    console.log(`Deleted cache for key: ${key}`);
  } catch (error) {
    console.error("Error deleting cache:", error);
  }
};

export default redisClient;
