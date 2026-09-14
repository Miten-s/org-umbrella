/** Cache for the resolved per-user access context (a cross-database join otherwise).
 * Invalidation is ON WRITE, not TTL — revoking access must take effect now. */
import redisClient, { connectRedis } from "./redis.config";

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  /** `ttlSeconds` bounds staleness for data this service can't actively invalidate —
   * e.g. a Gxp_Service role's permissions, edited on the platform's own Roles screen,
   * which has no channel back into gxp-service's cache. Per-user membership changes
   * (made in gxp-service itself) are still invalidated immediately, not TTL-bound. */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
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

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await connectRedis();
    const json = JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.set(key, json, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, json);
    }
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
