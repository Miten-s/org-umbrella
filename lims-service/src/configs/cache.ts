/**
 * Cache used for the resolved per-user access context (groups + permissions),
 * which would otherwise be four joins on every single request.
 *
 * Invalidation is ON WRITE, not TTL expiry: when a role, group or lims_user
 * row changes, the affected keys are dropped immediately. That is a hard
 * requirement rather than an optimisation — in a regulated system, revoking
 * someone's access must take effect now, not whenever a timer lapses.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOTE: the default store is IN-MEMORY, which is only correct for a single
 * process. With more than one instance behind a load balancer, an invalidation
 * on instance A leaves instance B serving stale permissions — which in this
 * system means serving revoked access.
 *
 * `redis` is not currently a dependency of lims-service and no REDIS_URL is
 * set, so this ships as memory-only. Before running more than one instance,
 * add a Redis store here — everything else already talks to the interface, so
 * it is a single-file change.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  /** Drops every key starting with `prefix` — used for broad invalidations. */
  delPrefix(prefix: string): Promise<void>;
  clear(): Promise<void>;
}

class MemoryCache implements CacheStore {
  private store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export const cache: CacheStore = new MemoryCache();

export default cache;
