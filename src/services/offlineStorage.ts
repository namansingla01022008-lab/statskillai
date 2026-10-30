import { openDB, deleteDB, IDBPDatabase } from 'idb';

const DB_NAME = 'statskillai_offline';
const DB_VERSION = 1;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CacheRecord<T = any> {
  key: string;
  data: T;
  cachedAt: number;
  userId?: string;
}

export interface OutboxMutation {
  mutationId: string; // UUID
  type: 'STEP_COMPLETE' | 'ASSESSMENT_SUBMIT';
  payload: any;
  createdAt: string;
  status: 'pending' | 'failed';
  error?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'mutationId' });
        }
      },
    });
  }
  return dbPromise;
}

export const OfflineStorage = {
  // --- Cache Store Operations ---
  async getCache<T>(key: string): Promise<{ data: T; cachedAt: number } | null> {
    try {
      const db = await getDb();
      const record = (await db.get('cache', key)) as CacheRecord<T> | undefined;
      if (!record) return null;

      // Discard records older than 7 days
      if (Date.now() - record.cachedAt > MAX_CACHE_AGE_MS) {
        await db.delete('cache', key);
        return null;
      }

      return { data: record.data, cachedAt: record.cachedAt };
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to read cache for key "${key}":`, err);
      return null;
    }
  },

  async setCache<T>(key: string, data: T, userId?: string): Promise<void> {
    try {
      const db = await getDb();
      const record: CacheRecord<T> = {
        key,
        data,
        cachedAt: Date.now(),
        userId,
      };
      await db.put('cache', record);
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to set cache for key "${key}":`, err);
    }
  },

  async deleteCache(key: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete('cache', key);
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to delete cache for key "${key}":`, err);
    }
  },

  // --- Outbox Store Operations ---
  async getOutbox(): Promise<OutboxMutation[]> {
    try {
      const db = await getDb();
      const all = (await db.getAll('outbox')) as OutboxMutation[];
      // Return sorted by creation timestamp (FIFO)
      return all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      console.warn('[OfflineStorage] Failed to read outbox:', err);
      return [];
    }
  },

  async addToOutbox(mutation: OutboxMutation): Promise<void> {
    try {
      const db = await getDb();
      await db.put('outbox', mutation);
    } catch (err) {
      console.error('[OfflineStorage] Failed to queue outbox mutation:', err);
      throw err;
    }
  },

  async removeMutation(mutationId: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete('outbox', mutationId);
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to remove mutation "${mutationId}":`, err);
    }
  },

  async updateMutationStatus(
    mutationId: string,
    status: 'pending' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const db = await getDb();
      const mutation = (await db.get('outbox', mutationId)) as OutboxMutation | undefined;
      if (mutation) {
        mutation.status = status;
        if (error) mutation.error = error;
        await db.put('outbox', mutation);
      }
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to update mutation status "${mutationId}":`, err);
    }
  },

  async getPendingCount(): Promise<number> {
    const outbox = await this.getOutbox();
    return outbox.filter((m) => m.status === 'pending').length;
  },

  // --- Session & Security Handlers ---
  async checkUserConsistency(currentUserId: string): Promise<void> {
    try {
      const cachedUser = await this.getCache<{ id: string }>('user_session_id');
      if (cachedUser && cachedUser.data.id !== currentUserId) {
        console.warn('[OfflineStorage] User mismatch detected. Purging previous user offline cache.');
        await this.wipeAllOfflineData();
      }
      if (currentUserId) {
        await this.setCache('user_session_id', { id: currentUserId }, currentUserId);
      }
    } catch (err) {
      console.warn('[OfflineStorage] User consistency check failed:', err);
    }
  },

  async wipeAllOfflineData(): Promise<void> {
    try {
      if (dbPromise) {
        const db = await dbPromise;
        db.close();
        dbPromise = null;
      }
      await deleteDB(DB_NAME);
      console.info('[OfflineStorage] IndexedDB purged successfully.');

      // Purge CacheStorage API entries (service worker HTTP caches)
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((name) => window.caches.delete(name)));
        console.info('[OfflineStorage] CacheStorage entries purged.');
      }
    } catch (err) {
      console.warn('[OfflineStorage] Error wiping offline data:', err);
    }
  },

  async requestPersistentStorage(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        if (isPersisted) {
          console.info('[OfflineStorage] Storage persistence granted.');
        }
      }
    } catch {
      // Ignore failures per spec
    }
  },
};

