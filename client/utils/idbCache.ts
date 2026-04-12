// client/utils/idbCache.ts
import { openDB, DBSchema } from 'idb';

// Define your DB schema
interface AppDB extends DBSchema {
  menuItems: {
    key: number;            // the 'id' field of menu item
    value: {
      id: number;
      name: string;
      description: string;
      price: number;
      category: string;
      available: boolean;
      image?: string;
      stockLevel?: number;
      lowStockThreshold?: number;
    };
  };
}

// Open DB
export async function getDB() {
  return openDB<AppDB>('appDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('menuItems')) {
        db.createObjectStore('menuItems', { keyPath: 'id' });
      }
    },
  });
}

// Safe put (handles missing ids)
export async function cacheMenuItems(menuItems: any[]) {
  const db = await getDB();
  const tx = db.transaction('menuItems', 'readwrite');
  const store = tx.objectStore('menuItems');

  for (const item of menuItems) {
    if (item.id == null) {
      console.warn('Skipping menu item with missing id', item);
      continue; // skip items with missing id
    }
    try {
      await store.put(item);
    } catch (err) {
      console.error('Failed to cache menu item', item, err);
    }
  }

  await tx.done;
  console.log('Menu items cached successfully!');
}

// Optional: get all cached menu items
export async function getCachedMenuItems() {
  const db = await getDB();
  return (await db.getAll('menuItems')) || [];
}