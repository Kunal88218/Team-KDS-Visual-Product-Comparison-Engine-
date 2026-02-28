/**
 * database.js
 * Handles local API operations for storing and retrieving 
 * image embeddings to ensure offline availability and speed.
 */

import { BaseDirectory, createDir, writeBinaryFile, readBinaryFile, writeTextFile, readTextFile, exists } from '@tauri-apps/api/fs';

const STORAGE_FOLDER = 'storage';
const META_FILE = `${STORAGE_FOLDER}/metadata.json`;
const EMBEDDINGS_FILE = `${STORAGE_FOLDER}/embeddings.bin`;

export async function initDB() {
    try {
        const hasFolder = await exists(STORAGE_FOLDER, { dir: BaseDirectory.AppData });
        if (!hasFolder) {
            await createDir(STORAGE_FOLDER, { dir: BaseDirectory.AppData, recursive: true });
        }
    } catch (e) {
        console.error("Failed to initialize storage folder:", e);
    }
}

export async function setMeta(key, value) {
    try {
        let meta = {};
        if (await exists(META_FILE, { dir: BaseDirectory.AppData })) {
            const data = await readTextFile(META_FILE, { dir: BaseDirectory.AppData });
            meta = JSON.parse(data);
        }
        meta[key] = value;
        await writeTextFile(META_FILE, JSON.stringify(meta), { dir: BaseDirectory.AppData });
    } catch (e) {
        console.error("Failed to set meta:", e);
    }
}

export async function getMeta(key) {
    try {
        if (await exists(META_FILE, { dir: BaseDirectory.AppData })) {
            const data = await readTextFile(META_FILE, { dir: BaseDirectory.AppData });
            const meta = JSON.parse(data);
            return meta[key] !== undefined ? meta[key] : null;
        }
        return null;
    } catch (e) {
        console.error("Failed to get meta:", e);
        return null;
    }
}

export async function saveEmbeddingsBatch(items) {
    try {
        let metaArray = [];
        let existingEmbeddings = new Float32Array(0);

        // Check if existing data is present
        if (await exists(META_FILE, { dir: BaseDirectory.AppData })) {
            const metaData = await readTextFile(META_FILE, { dir: BaseDirectory.AppData });
            const parsedMeta = JSON.parse(metaData);
            if (Array.isArray(parsedMeta.items)) {
                metaArray = parsedMeta.items;
            }
        }

        if (await exists(EMBEDDINGS_FILE, { dir: BaseDirectory.AppData })) {
            const binData = await readBinaryFile(EMBEDDINGS_FILE, { dir: BaseDirectory.AppData });
            existingEmbeddings = new Float32Array(binData.buffer);
        }

        if (items.length === 0) return;
        const vectorLength = items[0].embedding.length;
        const newTotalLength = existingEmbeddings.length + (items.length * vectorLength);
        const combinedEmbeddings = new Float32Array(newTotalLength);

        combinedEmbeddings.set(existingEmbeddings, 0);

        let offset = existingEmbeddings.length;
        for (const item of items) {
            metaArray.push({ id: metaArray.length, path: item.imagePath });
            combinedEmbeddings.set(item.embedding, offset);
            offset += vectorLength;
        }

        // Convert the Float32Array to a Uint8Array so Tauri can serialize it to disk cleanly
        const uint8Array = new Uint8Array(combinedEmbeddings.buffer);
        await writeBinaryFile(EMBEDDINGS_FILE, uint8Array, { dir: BaseDirectory.AppData });
        await setMeta('items', metaArray);
    } catch (e) {
        console.error("Failed to save batch:", e);
    }
}

export async function getAllEmbeddings() {
    try {
        if (!(await exists(META_FILE, { dir: BaseDirectory.AppData })) || !(await exists(EMBEDDINGS_FILE, { dir: BaseDirectory.AppData }))) {
            return [];
        }

        const metaData = await readTextFile(META_FILE, { dir: BaseDirectory.AppData });
        const parsedMeta = JSON.parse(metaData);
        const metaArray = parsedMeta.items || [];

        const binData = await readBinaryFile(EMBEDDINGS_FILE, { dir: BaseDirectory.AppData });
        const floatArray = new Float32Array(binData.buffer);

        const vectorLength = metaArray.length > 0 ? floatArray.length / metaArray.length : 1024;
        const results = [];

        for (let i = 0; i < metaArray.length; i++) {
            const start = i * vectorLength;
            const end = start + vectorLength;
            const embedding = floatArray.slice(start, end);
            results.push({
                imagePath: metaArray[i].path,
                embedding: embedding
            });
        }
        return results;
    } catch (e) {
        console.error("Failed to get all embeddings:", e);
        return [];
    }
}

export async function countEmbeddings() {
    try {
        if (await exists(META_FILE, { dir: BaseDirectory.AppData })) {
            const metaData = await readTextFile(META_FILE, { dir: BaseDirectory.AppData });
            const parsedMeta = JSON.parse(metaData);
            return parsedMeta.items ? parsedMeta.items.length : 0;
        }
        return 0;
    } catch (e) {
        console.error("Failed to count embeddings:", e);
        return 0;
    }
}

export async function resetDatabase() {
    try {
        await writeTextFile(META_FILE, JSON.stringify({ embeddingsGenerated: false }), { dir: BaseDirectory.AppData });
        await writeBinaryFile(EMBEDDINGS_FILE, new Uint8Array([]), { dir: BaseDirectory.AppData });
    } catch (e) {
        console.error("Failed to reset database:", e);
    }
}
