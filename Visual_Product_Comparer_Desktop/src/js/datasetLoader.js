/**
 * datasetLoader.js
 * Handles scanning the selected local folder and extracting images.
 */

import { extractEmbedding } from './embedding.js';
import { readDir } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';

/**
 * Scans a local directory for image files recursively.
 * @param {string} dirPath 
 * @returns {Promise<Array<string>>}
 */
export async function scanDatasetDirectory(dirPath) {
    const imageUrls = [];

    async function processNode(entries) {
        for (const entry of entries) {
            if (entry.children) {
                await processNode(entry.children);
            } else if (entry.path.match(/\.(jpg|jpeg|png|webp)$/i)) {
                // Return absolute paths
                // Replace backward slashes with forward slashes for cross-platform ease
                imageUrls.push(entry.path.replace(/\\/g, '/'));
            }
        }
    }

    try {
        const entries = await readDir(dirPath, { recursive: true });
        await processNode(entries);
        return imageUrls;
    } catch (e) {
        throw new Error(`Failed to read directory: ${e.message}`);
    }
}

/**
 * Loads an image from URL/ObjectURL/LocalPath and resizes it to 224x224 using Canvas.
 * MobileNet uses 224x224 internally, so resizing here saves memory and computation.
 * @param {string} src 
 * @returns {Promise<HTMLCanvasElement>}
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Retrieve or create the hidden processing canvas
            let canvas = document.getElementById('processing-canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'processing-canvas';
                canvas.style.display = 'none';
                document.body.appendChild(canvas);
            }

            // Set dimensions to MobileNet v2 defaults
            canvas.width = 224;
            canvas.height = 224;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Draw and resize image onto canvas
            ctx.drawImage(img, 0, 0, 224, 224);

            // Return canvas to act as the element for tf.browser.fromPixels
            resolve(canvas);
        };
        img.onerror = (e) => reject(`Failed to load image: ${src}`);

        // Use Tauri custom protocol for local absolute paths
        let finalSrc = src;
        if (!src.startsWith('blob:') && !src.startsWith('http') && !src.startsWith('data:')) {
            try {
                finalSrc = convertFileSrc(src);
            } catch (e) {
                console.error("Failed to convert file src", src, e);
            }
        }

        img.src = finalSrc;
    });
}

/**
 * Processes a list of image files/URLs in batches, extracts embeddings, and yields progress.
 * 
 * @param {Array<File|string>} items List of File objects OR URL strings
 * @param {Function} onProgress 
 * @returns {Promise<Array<{imagePath: string, embedding: Float32Array}>>}
 */
export async function processDataset(items, onProgress) {
    const results = [];
    const total = items.length;
    const batchSize = 15; // Process 15 images at a time to prevent UI freezing

    for (let i = 0; i < total; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        // Process current batch in parallel
        const batchPromises = batch.map(async (item) => {
            let imgElement;
            let imagePath;
            let objectUrl = null;

            try {
                if (item instanceof File) {
                    imagePath = item.name;
                    objectUrl = URL.createObjectURL(item);
                    imgElement = await loadImage(objectUrl);
                } else {
                    imagePath = item; // URL string
                    imgElement = await loadImage(item);
                }

                // Extract normalized embedding
                const embedding = await extractEmbedding(imgElement);

                return {
                    imagePath: imagePath,
                    embedding: embedding
                };

            } catch (error) {
                console.warn(`Skipping ${item.name || item}:`, error);
                return null;
            } finally {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
            }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Filter out failures and push to main results
        for (const res of batchResults) {
            if (res) results.push(res);
        }

        // Report progress
        if (onProgress) {
            onProgress(Math.min(i + batchSize, total), total);
        }

        // Yield to event loop to unblock UI thread
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return results;
}
