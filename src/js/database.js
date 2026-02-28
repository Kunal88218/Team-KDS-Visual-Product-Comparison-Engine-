/**
 * database.js
 * Handles all IndexedDB operations for storing and retrieving 
 * image embeddings to ensure offline availability and speed.
 */

const DB_NAME = 'VisualSearchDB';
const STORE_NAME = 'embeddings';
const META_STORE = 'meta';
const DB_VERSION = 2; // Upgraded to v2 to add meta store

let db;

/**
 * Initializes the IndexedDB.
 * @returns {Promise<void>}
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB Error:", event.target.error);
            reject("Error initializing IndexedDB");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // KeyPath is the imagePath (unique identifier)
                db.createObjectStore(STORE_NAME, { keyPath: 'imagePath' });
            }
            if (!db.objectStoreNames.contains(META_STORE)) {
                // KeyPath is the key property
                db.createObjectStore(META_STORE, { keyPath: 'key' });
            }
        };
    });
}

/**
 * Sets a key-value pair in the metadata store.
 * @param {string} key 
 * @param {any} value 
 * @returns {Promise<void>}
 */
export function setMeta(key, value) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");
        const transaction = db.transaction([META_STORE], 'readwrite');
        const store = transaction.objectStore(META_STORE);

        const request = store.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Gets a value by key from the metadata store.
 * @param {string} key 
 * @returns {Promise<any>}
 */
export function getMeta(key) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");
        const transaction = db.transaction([META_STORE], 'readonly');
        const store = transaction.objectStore(META_STORE);

        const request = store.get(key);
        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Checks if the database is already populated with embeddings.
 * @returns {Promise<boolean>}
 */
export function countEmbeddings() {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
            resolve(countRequest.result);
        };
        countRequest.onerror = () => {
            reject("Error counting embeddings");
        };
    });
}

/**
 * Saves a batch of embeddings to the database for efficiency.
 * @param {Array<{imagePath: string, embedding: Float32Array}>} items 
 * @returns {Promise<void>}
 */
export function saveEmbeddingsBatch(items) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = (event) => {
            console.error("Batch save error:", event.target.error);
            reject("Error saving embeddings batch");
        };

        items.forEach(item => {
            store.put(item);
        });
    });
}

/**
 * Retrieves all stored embeddings.
 * @returns {Promise<Array<{imagePath: string, embedding: Float32Array}>>}
 */
export function getAllEmbeddings() {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject("Error fetching embeddings");
        };
    });
}
