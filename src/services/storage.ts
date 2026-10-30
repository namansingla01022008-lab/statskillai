/**
 * Central Storage Wrapper Module
 * 
 * Provides namespaced, TTL-wrapped, quota-resilient, debounced localStorage access
 * with in-memory caching to eliminate redundant main-thread JSON.parse/stringify.
 */

import {
  STORAGE_PREFIX,
  DEFAULT_TTL_MS,
  STORAGE_BUDGET,
} from './storageConfig';

export interface StorageEnvelope<T> {
  /** Expiration timestamp (epoch ms) */
  t: number;
  /** Actual payload value */
  v: T;
  /** Timestamp when written (for LRU / eviction order) */
  w?: number;
}

export interface KeySizeReport {
  key: string;
  bytes: number;
  expiresAt: string;
}

// In-memory hot cache to avoid synchronous JSON.parse on every component render
const memoryCache = new Map<string, { value: any; expiry: number }>();

// Debounced writes queue
const pendingDebouncedWrites = new Map<
  string,
  {
    timer: any;
    value: any;
    ttlMs: number;
    resolve: () => void;
  }
>();

/**
 * Flush all pending debounced writes immediately.
 * Called automatically on visibilitychange and pagehide events.
 */
export function flushPendingWrites(): void {
  if (pendingDebouncedWrites.size === 0) return;

  for (const [key, pending] of pendingDebouncedWrites.entries()) {
    clearTimeout(pending.timer);
    storage.save(key, pending.value, pending.ttlMs);
    pending.resolve();
  }
  pendingDebouncedWrites.clear();
}

// Register browser lifecycle listeners for unloads/visibility changes
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingWrites();
    }
  });

  window.addEventListener('pagehide', () => {
    flushPendingWrites();
  });
}

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return true;
}

function getFullKey(key: string): string {
  if (key.startsWith(STORAGE_PREFIX)) {
    return key;
  }
  return `${STORAGE_PREFIX}${key}`;
}

export const storage = {
  /**
   * Save a value wrapped in a TTL envelope.
   * Handles QuotaExceededError via automated LRU/expiry eviction.
   */
  save<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): boolean {
    if (!isStorageAvailable()) return false;

    const fullKey = getFullKey(key);
    const now = Date.now();
    const envelope: StorageEnvelope<T> = {
      t: now + ttlMs,
      v: value,
      w: now,
    };

    // Update in-memory hot cache immediately
    memoryCache.set(fullKey, { value, expiry: envelope.t });

    try {
      const serialized = JSON.stringify(envelope);
      const byteSize = new Blob([serialized]).size;

      if (byteSize > STORAGE_BUDGET.MAX_SINGLE_KEY_BYTES) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[Storage] Warning: Key "${key}" exceeds recommended single-key budget (${(byteSize / 1024).toFixed(1)} KB > 50 KB).`
          );
        }
      }

      window.localStorage.setItem(fullKey, serialized);
      return true;
    } catch (err: any) {
      const isQuota =
        err?.name === 'QuotaExceededError' ||
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err?.code === 22 ||
        err?.code === 1014;

      if (isQuota) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Storage] QuotaExceededError encountered. Initiating 25% oldest key eviction...');
        }

        const evicted = this.evictOldestKeys(STORAGE_BUDGET.EVICTION_RATIO);
        if (evicted > 0) {
          try {
            window.localStorage.setItem(fullKey, JSON.stringify(envelope));
            return true;
          } catch (retryErr) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[Storage] Quota retry failed after eviction.', retryErr);
            }
            return false;
          }
        }
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Storage] Failed to save key "${key}":`, err);
      }
      return false;
    }
  },

  /**
   * Load a value from storage.
   * Returns in-memory cached copy if valid, or reads and parses from localStorage.
   * Deletes expired entries on read. Returns null if missing, expired, or invalid.
   */
  load<T>(key: string): T | null {
    if (!isStorageAvailable()) return null;

    const fullKey = getFullKey(key);
    const now = Date.now();

    // 1. Check in-memory hot cache
    const mem = memoryCache.get(fullKey);
    if (mem) {
      if (mem.expiry > now) {
        return mem.value as T;
      }
      // Expired in memory
      memoryCache.delete(fullKey);
      this.remove(key);
      return null;
    }

    // 2. Read from localStorage
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (!raw) return null;

      const envelope = JSON.parse(raw) as StorageEnvelope<T>;
      if (!envelope || typeof envelope !== 'object' || !('t' in envelope) || !('v' in envelope)) {
        // Legacy or un-enveloped value
        return (envelope as unknown) as T;
      }

      // Check TTL expiry
      if (envelope.t && envelope.t <= now) {
        this.remove(key);
        return null;
      }

      // Cache in memory for subsequent render calls
      memoryCache.set(fullKey, { value: envelope.v, expiry: envelope.t });
      return envelope.v;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Storage] Corrupt payload for key "${key}", purging:`, err);
      }
      this.remove(key);
      return null;
    }
  },

  /**
   * Remove a single key from localStorage and memory cache.
   */
  remove(key: string): void {
    if (!isStorageAvailable()) return;
    const fullKey = getFullKey(key);
    memoryCache.delete(fullKey);
    try {
      window.localStorage.removeItem(fullKey);
    } catch {
      // Ignore
    }
  },

  /**
   * Clear all keys owned by this application's namespace.
   * Does NOT touch third-party or unnamespaced items.
   */
  clearAll(): void {
    if (!isStorageAvailable()) return;
    memoryCache.clear();

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Storage] clearAll failed:', err);
      }
    }
  },

  /**
   * Debounced save helper.
   * Defers writes by debounceMs (default 500ms) to prevent main-thread churn on rapid interactions.
   * Flushes automatically on tab hide / visibilitychange.
   */
  saveDebounced<T>(
    key: string,
    value: T,
    ttlMs: number = DEFAULT_TTL_MS,
    debounceMs: number = STORAGE_BUDGET.DEFAULT_DEBOUNCE_MS
  ): Promise<void> {
    const fullKey = getFullKey(key);

    // Update in-memory cache immediately so UI reads see the newest value synchronously
    memoryCache.set(fullKey, { value, expiry: Date.now() + ttlMs });

    // Cancel existing pending write for this key
    const existing = pendingDebouncedWrites.get(fullKey);
    if (existing) {
      clearTimeout(existing.timer);
    }

    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        pendingDebouncedWrites.delete(fullKey);
        this.save(key, value, ttlMs);
        resolve();
      }, debounceMs);

      pendingDebouncedWrites.set(fullKey, {
        timer,
        value,
        ttlMs,
        resolve,
      });
    });
  },

  /**
   * Evicts the oldest ~25% of application keys when storage limit is exceeded.
   * Returns the count of evicted keys.
   */
  evictOldestKeys(ratio: number = STORAGE_BUDGET.EVICTION_RATIO): number {
    if (!isStorageAvailable()) return 0;

    interface Candidate {
      fullKey: string;
      writeTime: number;
      expiry: number;
      bytes: number;
    }

    const candidates: Candidate[] = [];
    const now = Date.now();

    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const fullKey = window.localStorage.key(i);
        if (!fullKey || !fullKey.startsWith(STORAGE_PREFIX)) continue;

        const raw = window.localStorage.getItem(fullKey);
        if (!raw) continue;

        let writeTime = now;
        let expiry = now + DEFAULT_TTL_MS;

        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.w === 'number') writeTime = parsed.w;
            if (typeof parsed.t === 'number') expiry = parsed.t;
          }
        } catch {
          // Unparseable - high priority candidate to evict
          writeTime = 0;
        }

        candidates.push({
          fullKey,
          writeTime,
          expiry,
          bytes: raw.length * 2, // UTF-16 approx
        });
      }

      if (candidates.length === 0) return 0;

      // First purge already expired keys
      let evictedCount = 0;
      const unexpired: Candidate[] = [];

      for (const item of candidates) {
        if (item.expiry <= now) {
          window.localStorage.removeItem(item.fullKey);
          memoryCache.delete(item.fullKey);
          evictedCount++;
        } else {
          unexpired.push(item);
        }
      }

      // If still need to evict, sort oldest writeTime first
      const targetToEvict = Math.max(1, Math.ceil(unexpired.length * ratio));
      unexpired.sort((a, b) => a.writeTime - b.writeTime);

      for (let i = 0; i < targetToEvict && i < unexpired.length; i++) {
        const item = unexpired[i];
        window.localStorage.removeItem(item.fullKey);
        memoryCache.delete(item.fullKey);
        evictedCount++;
      }

      return evictedCount;
    } catch {
      return 0;
    }
  },

  /**
   * Returns total approximate storage consumption (in bytes) across all namespaced keys.
   */
  getUsageBytes(): number {
    if (!isStorageAvailable()) return 0;
    let totalBytes = 0;

    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          const val = window.localStorage.getItem(k);
          if (val) {
            totalBytes += (k.length + val.length) * 2;
          }
        }
      }
    } catch {
      // Ignore
    }
    return totalBytes;
  },

  /**
   * Dev-only helper to inspect and log key-by-key byte consumption.
   */
  logKeySizes(): KeySizeReport[] {
    if (!isStorageAvailable()) return [];

    const reports: KeySizeReport[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          const val = window.localStorage.getItem(k) || '';
          let expiresAt = 'unknown';
          try {
            const parsed = JSON.parse(val);
            if (parsed?.t) {
              expiresAt = new Date(parsed.t).toISOString();
            }
          } catch {
            // Ignore
          }

          reports.push({
            key: k.replace(STORAGE_PREFIX, ''),
            bytes: (k.length + val.length) * 2,
            expiresAt,
          });
        }
      }
      reports.sort((a, b) => b.bytes - a.bytes);

      if (process.env.NODE_ENV !== 'production') {
        console.group('[Storage] Key Size Breakdown');
        console.table(reports);
        const total = this.getUsageBytes();
        console.log(`Total App Storage Usage: ${(total / 1024).toFixed(2)} KB / 500 KB Budget`);
        console.groupEnd();
      }
    } catch {
      // Ignore
    }
    return reports;
  },
};

