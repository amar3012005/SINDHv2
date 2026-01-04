/**
 * Offline storage utility using IndexedDB for caching critical data
 */

const DB_NAME = 'sindh-offline-db';
const DB_VERSION = 1;
const STORES = {
  PROFILE: 'profile',
  JOBS: 'jobs',
  NOTIFICATIONS: 'notifications'
};

/**
 * Open the IndexedDB database
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Profile store
      if (!db.objectStoreNames.contains(STORES.PROFILE)) {
        db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
      }
      
      // Jobs store
      if (!db.objectStoreNames.contains(STORES.JOBS)) {
        db.createObjectStore(STORES.JOBS, { keyPath: 'id' });
      }

      // Notifications store
      if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
        db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save data to a specific store
 */
const saveToStore = async (storeName, data) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    if (Array.isArray(data)) {
      data.forEach(item => store.put({ ...item, lastUpdated: Date.now() }));
    } else {
      store.put({ ...data, lastUpdated: Date.now() });
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error(`IndexedDB Error (save to ${storeName}):`, error);
    return false;
  }
};

/**
 * Get all data from a specific store
 */
const getAllFromStore = async (storeName) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB Error (get from ${storeName}):`, error);
    return [];
  }
};

/**
 * Get single item from store
 */
const getFromStore = async (storeName, id) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`IndexedDB Error (get item ${id} from ${storeName}):`, error);
    return null;
  }
};

/**
 * Exported API
 */
export const offlineStorage = {
  // Profile
  saveProfile: (userId, profileData) => saveToStore(STORES.PROFILE, { id: userId, ...profileData }),
  getProfile: (userId) => getFromStore(STORES.PROFILE, userId),
  
  // Jobs
  saveJobs: (jobs) => saveToStore(STORES.JOBS, jobs),
  getJobs: () => getAllFromStore(STORES.JOBS),
  
  // Notifications
  saveNotifications: (notifications) => saveToStore(STORES.NOTIFICATIONS, notifications),
  getNotifications: () => getAllFromStore(STORES.NOTIFICATIONS),
  
  // Clear all
  clearAll: async () => {
    const db = await openDB();
    const tx = db.transaction(Object.values(STORES), 'readwrite');
    Object.values(STORES).forEach(storeName => tx.objectStore(storeName).clear());
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  }
};


