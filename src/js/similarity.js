/**
 * similarity.js
 * Contains the pure math logic for cosine similarity between two feature vectors.
 */

/**
 * Calculates the cosine similarity of two Float32Arrays.
 * formula: dot(A, B) / (|A| * |B|)
 * 
 * @param {Float32Array|Array} vecA 
 * @param {Float32Array|Array} vecB 
 * @returns {number} Score between -1 and 1
 */
export function computeCosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error("Vectors must be of the same length.");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Finds the top N most similar matches from the database.
 * 
 * @param {Float32Array} queryEmbedding 
 * @param {Array<{imagePath: string, embedding: Float32Array}>} dbEmbeddings 
 * @param {number} topK 
 * @returns {Array<{imagePath: string, score: number}>}
 */
export function findTopMatches(queryEmbedding, dbEmbeddings, topK = 5) {
    const scored = dbEmbeddings.map(item => {
        const score = computeCosineSimilarity(queryEmbedding, item.embedding);
        return {
            imagePath: item.imagePath,
            score: score
        };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Filter out exact matches if score is almost exactly 1? 
    // Usually we just return the top K.
    // Return top K
    return scored.slice(0, topK);
}
