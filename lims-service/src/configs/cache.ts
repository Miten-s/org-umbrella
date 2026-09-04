/** Cache for the resolved per-user access context (four joins otherwise). Invalidation is
 * ON WRITE, not TTL — revoking access must take effect now. NOTE: default store is
 * IN-MEMORY, correct only for a single process — add a Redis store here before scaling out. */
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
