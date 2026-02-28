/**
 * cache.js
 * In-memory caching for Float32Array embeddings to dramatically speed up similarity search
 * by bypassing IndexedDB reads during calculations.
 */

let embeddingCache = [];

/**
 * Replace the current cache with a new array.
 * @param {Array<{imagePath: string, embedding: Float32Array}>} newCache 
 */
export function setEmbeddingCache(newCache) {
    embeddingCache = newCache;
}

/**
 * Returns a reference to the global in-memory embedding cache.
 * @returns {Array<{imagePath: string, embedding: Float32Array}>}
 */
export function getEmbeddingCache() {
    return embeddingCache;
}

/**
 * Adds an array of new items to the global cache without overwriting.
 * @param {Array<{imagePath: string, embedding: Float32Array}>} newItems 
 */
export function appendToEmbeddingCache(newItems) {
    embeddingCache.push(...newItems);
}
