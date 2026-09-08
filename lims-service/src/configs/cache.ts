/** Cache for the resolved per-user access context (four joins otherwise). Invalidation is
 * ON WRITE, not TTL — revoking access must take effect now. */
import redisClient, { connectRedis } from "./redis.config";

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  /** Drops every key starting with `prefix` — used for broad invalidations. */
  delPrefix(prefix: string): Promise<void>;
  clear(): Promise<void>;
}

class RedisCache implements CacheStore {
  async get<T>(key: string): Promise<T | null> {
    await connectRedis();
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await connectRedis();
    await redisClient.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await connectRedis();
    await redisClient.del(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    await connectRedis();
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }

  async clear(): Promise<void> {
    await connectRedis();
    await redisClient.flushDb();
  }
}

export const cache: CacheStore = new RedisCache();

export default cache;
