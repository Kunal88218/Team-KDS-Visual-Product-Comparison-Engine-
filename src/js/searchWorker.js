/**
 * searchWorker.js
 * Web Worker for running similarity searches (dot product) off the main thread
 * to guarantee there is zero UI freezing on databases up to 10k images.
 */

/**
 * Highly optimized Dot Product calculation.
 * Pre-requisite: Both A and B must be L2 normalized Float32Arrays.
 * @param {Float32Array} a 
 * @param {Float32Array} b 
 * @returns {number} Wait, similarity score (dot product)
 */
function dotProduct(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

self.onmessage = function (e) {
    const { queryEmbedding, embeddingCache, topK } = e.data;

    // We assume embeddingCache shape -> { imagePath: string, embedding: Float32Array }[]
    const scored = new Array(embeddingCache.length);

    for (let i = 0; i < embeddingCache.length; i++) {
        const item = embeddingCache[i];
        scored[i] = {
            imagePath: item.imagePath,
            score: dotProduct(queryEmbedding, item.embedding)
        };
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const topMatches = scored.slice(0, topK || 5);

    // Send the matches back to the main thread
    self.postMessage({ matches: topMatches });
};
