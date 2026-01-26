// Offline utilities for PWA functionality
// Handles caching strategies, data persistence, and offline operations

// Cache keys
export const CACHE_KEYS = {
  RESERVATIONS: 'reservations',
  MENU_ITEMS: 'menu_items',
  ROOM_DATA: 'room_data',
  USER_PROFILE: 'user_profile',
  PENDING_ORDERS: 'pending_orders',
} as const;

// IndexedDB database name and version
const DB_NAME = 'FosuaPapabiHotel';
const DB_VERSION = 1;

// Open IndexedDB
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('reservations')) {
        db.createObjectStore('reservations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('menu_items')) {
        db.createObjectStore('menu_items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_orders')) {
        db.createObjectStore('pending_orders', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('user_data')) {
        db.createObjectStore('user_data', { keyPath: 'key' });
      }
    };
  });
}

// Generic IndexedDB operations
async function getFromDB(storeName: string, key: string | number): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function putInDB(storeName: string, data: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getAllFromDB(storeName: string): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

async function deleteFromDB(storeName: string, key: string | number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Cache management functions
export const OfflineCache = {
  // Store reservation data for offline access
  async cacheReservations(reservations: any[]): Promise<void> {
    try {
      await putInDB('reservations', { key: CACHE_KEYS.RESERVATIONS, data: reservations, timestamp: Date.now() });
      // Also notify service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'STORE_OFFLINE_DATA',
          data: { key: CACHE_KEYS.RESERVATIONS, value: reservations }
        });
      }
    } catch (error) {
      console.error('Failed to cache reservations:', error);
    }
  },

  // Get cached reservations
  async getCachedReservations(): Promise<any[] | null> {
    try {
      const cached = await getFromDB('reservations', CACHE_KEYS.RESERVATIONS);
      if (cached && cached.data) {
        // Check if cache is still fresh (24 hours)
        const age = Date.now() - (cached.timestamp || 0);
        if (age < 24 * 60 * 60 * 1000) {
          return cached.data;
        }
      }
    } catch (error) {
      console.error('Failed to get cached reservations:', error);
    }
    return null;
  },

  // Cache menu items
  async cacheMenuItems(menuItems: any[]): Promise<void> {
    try {
      await putInDB('menu_items', { key: CACHE_KEYS.MENU_ITEMS, data: menuItems, timestamp: Date.now() });
      // Notify service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'STORE_OFFLINE_DATA',
          data: { key: CACHE_KEYS.MENU_ITEMS, value: menuItems }
        });
      }
    } catch (error) {
      console.error('Failed to cache menu items:', error);
    }
  },

  // Get cached menu items
  async getCachedMenuItems(): Promise<any[] | null> {
    try {
      const cached = await getFromDB('menu_items', CACHE_KEYS.MENU_ITEMS);
      if (cached && cached.data) {
        const age = Date.now() - (cached.timestamp || 0);
        if (age < 24 * 60 * 60 * 1000) {
          return cached.data;
        }
      }
    } catch (error) {
      console.error('Failed to get cached menu items:', error);
    }
    return null;
  },

  // Store pending order for background sync
  async storePendingOrder(order: any): Promise<string> {
    try {
      const pendingOrder = {
        ...order,
        timestamp: Date.now(),
        synced: false,
      };
      await putInDB('pending_orders', pendingOrder);
      return pendingOrder.id;
    } catch (error) {
      console.error('Failed to store pending order:', error);
      throw error;
    }
  },

  // Get all pending orders
  async getPendingOrders(): Promise<any[]> {
    try {
      return await getAllFromDB('pending_orders');
    } catch (error) {
      console.error('Failed to get pending orders:', error);
      return [];
    }
  },

  // Mark order as synced
  async markOrderSynced(orderId: string): Promise<void> {
    try {
      await deleteFromDB('pending_orders', orderId);
    } catch (error) {
      console.error('Failed to mark order as synced:', error);
    }
  },

  // Clear all cached data
  async clearCache(): Promise<void> {
    try {
      const db = await openDB();
      const transaction = db.transaction(['reservations', 'menu_items', 'pending_orders', 'user_data'], 'readwrite');

      ['reservations', 'menu_items', 'pending_orders', 'user_data'].forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });

      // Also clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },
};

// Network status utilities
export const NetworkUtils = {
  isOnline(): boolean {
    return navigator.onLine;
  },

  async waitForOnline(): Promise<void> {
    if (this.isOnline()) return;

    return new Promise((resolve) => {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    });
  },

  getConnectionQuality(): 'slow' | 'good' | 'fast' | 'offline' {
    if (!this.isOnline()) return 'offline';

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!connection) return 'fast';

    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'good';
      case '4g':
      default:
        return 'fast';
    }
  },
};

// Background sync utilities
export const BackgroundSync = {
  async registerSync(tag: string = 'background-sync'): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  },

  async syncPendingData(): Promise<void> {
    try {
      const pendingOrders = await OfflineCache.getPendingOrders();

      for (const order of pendingOrders) {
        try {
          // Attempt to sync the order
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(order),
          });

          if (response.ok) {
            await OfflineCache.markOrderSynced(order.id);
            console.log('Order synced successfully:', order.id);
          }
        } catch (error) {
          console.error('Failed to sync order:', order.id, error);
        }
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  },
};

// Data freshness indicators
export const DataFreshness = {
  isDataFresh(timestamp: number, maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - timestamp < maxAge;
  },

  getDataAge(timestamp: number): string {
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(age / (1000 * 60 * 60));
    const days = Math.floor(age / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },
};