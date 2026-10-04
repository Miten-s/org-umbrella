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

/** A Redis failure is a cache miss, never a request failure: permissions are then
 * resolved from their source on every request until Redis is back. */
const tolerate = async <T>(
  operation: string,
  run: () => Promise<T>,
  fallback: T
): Promise<T> => {
  if (!redisClient.isReady) {
    await connectRedis();
    return fallback;
  }
  try {
    return await run();
  } catch (error) {
    console.error(
      `cache ${operation} failed, continuing without cache:`,
      error
    );
    return fallback;
  }
};

class RedisCache implements CacheStore {
  async get<T>(key: string): Promise<T | null> {
    return tolerate(
      "get",
      async () => {
        const data = await redisClient.get(key);
        return data ? (JSON.parse(data) as T) : null;
      },
      null
    );
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    await tolerate(
      "set",
      async () => {
        if (ttlSeconds) {
          await redisClient.set(key, json, { EX: ttlSeconds });
        } else {
          await redisClient.set(key, json);
        }
      },
      undefined
    );
  }

  async del(key: string): Promise<void> {
    await tolerate(
      "del",
      async () => {
        await redisClient.del(key);
      },
      undefined
    );
  }

  async delPrefix(prefix: string): Promise<void> {
    await tolerate(
      "delPrefix",
      async () => {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) await redisClient.del(keys);
      },
      undefined
    );
  }

  async clear(): Promise<void> {
    await tolerate(
      "clear",
      async () => {
        await redisClient.flushDb();
      },
      undefined
    );
  }
}

export const cache: CacheStore = new RedisCache();

export default cache;
