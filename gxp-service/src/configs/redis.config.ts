import { createClient } from "redis";
import ENV from "../utils/environment";

const redisClient = createClient({
  url: ENV.REDIS_SERVER_URL,
  password: ENV.REDIS_SERVER_PASSWORD, // Use the same password set in redis.conf
  socket: {
    // Explicit rather than the library default: back off to a 5s ceiling and keep
    // retrying forever. Giving up would leave a subscriber permanently deaf to
    // invalidation messages with nothing to signal it.
    reconnectStrategy: (retries: number) => Math.min(retries * 200, 5000)
  },
  // While disconnected, commands fail at once instead of queuing until Redis returns —
  // callers treat a failed cache call as a miss, so a Redis outage never hangs a request.
  disableOfflineQueue: true
});

const recoveryHandlers: (() => Promise<void>)[] = [];
let connectionLost = false;

redisClient.on("error", (err) => {
  connectionLost = true;
  console.error("Redis Client Error:", err);
});
redisClient.on("reconnecting", () => {
  connectionLost = true;
});
redisClient.on("ready", () => {
  if (!connectionLost) return;
  connectionLost = false;
  for (const handler of recoveryHandlers) {
    handler().catch((error) =>
      console.error("Redis recovery handler failed:", error)
    );
  }
});

/** Runs `handler` each time Redis comes back after an outage. Invalidations sent while it
 * was down were lost, so anything cached from before the outage may be stale. */
export const onRedisRecovered = (handler: () => Promise<void>): void => {
  recoveryHandlers.push(handler);
};

let connecting: Promise<void> | null = null;

/** Never waits for Redis: a request must not block on a cache that is down. */
export const connectRedis = async (): Promise<void> => {
  if (redisClient.isOpen || connecting) return;
  connecting = redisClient
    .connect()
    .then(() => console.log("Connected to Redis with authentication"))
    .catch((error) => console.error("Redis connection error:", error))
    .finally(() => {
      connecting = null;
    });
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
