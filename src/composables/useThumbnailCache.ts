interface CacheEntry {
  key: string;
  dataUrl: string;
  timestamp: number;
}

const DB_NAME = 'inchbox-thumbnails';
const STORE_NAME = 'thumbnails';
const MAX_ENTRIES = 50;

export function useThumbnailCache() {
  async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  function generateCacheKey(path: string, size: number, modifiedTime: number): string {
    return `${path}:${size}:${modifiedTime}`;
  }

  async function getThumbnail(path: string, size: number, modifiedTime: number): Promise<string | null> {
    try {
      const db = await initDB();
      const key = generateCacheKey(path, size, modifiedTime);
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        
        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined;
          if (entry) {
            resolve(entry.dataUrl);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get thumbnail from cache:', error);
      return null;
    }
  }

  async function setThumbnail(path: string, size: number, modifiedTime: number, dataUrl: string): Promise<void> {
    try {
      const db = await initDB();
      const key = generateCacheKey(path, size, modifiedTime);
      
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const entry: CacheEntry = {
          key,
          dataUrl,
          timestamp: Date.now(),
        };
        const request = store.put(entry);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // Clean up old entries
      await cleanupLRU();
    } catch (error) {
      console.error('Failed to save thumbnail to cache:', error);
    }
  }

  async function cleanupLRU(): Promise<void> {
    try {
      const db = await initDB();
      
      const entries = await new Promise<CacheEntry[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result as CacheEntry[]);
        request.onerror = () => reject(request.error);
      });
      
      if (entries.length > MAX_ENTRIES) {
        // Sort by timestamp (oldest first)
        const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = sortedEntries.slice(0, sortedEntries.length - MAX_ENTRIES);
        
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          toDelete.forEach(entry => {
            store.delete(entry.key);
          });
          
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  async function clearAll(): Promise<void> {
    try {
      const db = await initDB();
      
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  return {
    generateCacheKey,
    getThumbnail,
    setThumbnail,
    cleanupLRU,
    clearAll,
  };
}
