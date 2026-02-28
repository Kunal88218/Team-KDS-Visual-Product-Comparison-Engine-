/**
 * app.js
 * Main entry point. Orchestrates the UI logic, MobileNet initialization, 
 * database extraction, and search functionality over Tauri.
 */

import { initializeModel, extractEmbedding } from './embedding.js';
import { initDB, saveEmbeddingsBatch, getAllEmbeddings, getMeta, setMeta, resetDatabase } from './database.js';
import { scanDatasetDirectory, processDataset, loadImage } from './datasetLoader.js';
import { setEmbeddingCache, getEmbeddingCache } from './cache.js';

import { open } from '@tauri-apps/api/dialog';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { exists, readDir } from '@tauri-apps/api/fs';

// DOM Elements
const statusText = document.getElementById('status-text');
const statusLoader = document.getElementById('status-loader');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const datasetContainer = document.getElementById('dataset-container');
const selectDatasetBtn = document.getElementById('select-dataset-btn');

const dropzone = document.getElementById('dropzone');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const clearUploadBtn = document.getElementById('clear-upload-btn');
const searchBtn = document.getElementById('search-btn');

const resultsGrid = document.getElementById('results-grid');
const matchCount = document.getElementById('match-count');

const preloadedContainer = document.getElementById('preloaded-datasets-container');
const preloadedList = document.getElementById('preloaded-datasets-list');

// State
let isReady = false;
let searchWorker = null;
let queryImageFile = null;

/**
 * Initializes the entire application state.
 */
async function initApp() {
    try {
        updateStatus("Initializing Database...", true);
        await initDB();

        // 1. Initialize Worker
        initWorker();

        updateStatus("Loading AI Model...", true);
        await initializeModel((msg) => updateStatus(msg, true));

        // 2. Check Meta Readiness Flag
        const embeddingsGenerated = await getMeta('embeddingsGenerated');

        if (embeddingsGenerated) {
            updateStatus(`Loading Cache...`, true);
            await loadEmbeddingsIntoMemory();

            const count = getEmbeddingCache().length;
            updateStatus(`Ready (${count} images indexed)`, false);
            enableUI();
        } else {
            // First time setup: Await dataset selection
            showDatasetSelectionUI();
        }

        // 3. Load UI for any pre-existent Custom Datasets physical paths
        await loadCustomDatasets();

    } catch (error) {
        console.error("Initialization error:", error);
        updateStatus("Failed to initialize. Check console.", false);
        statusText.style.color = "var(--accent)";
    }
}

function initWorker() {
    // Workers in Vite+Tauri need robust path resolution. In Vite, workers can be initialized using ?worker
    searchWorker = new Worker(new URL('./searchWorker.js', import.meta.url), { type: 'module' });
}

function updateStatus(message, showLoader = false) {
    statusText.textContent = message;
    statusLoader.style.display = showLoader ? 'inline-block' : 'none';
}

function showDatasetSelectionUI() {
    updateStatus("Awaiting dataset selection", false);
    datasetContainer.classList.remove('hidden');
}

/**
 * Automatically loads known custom offline datasets securely.
 */
async function loadCustomDatasets() {
    const customDir = '/Users/sharanyo/Sem 2 Coding/WAP/Visual_Product_Comparer/CustomDataset';
    try {
        if (await exists(customDir)) {
            const entries = await readDir(customDir);
            const validFolders = entries.filter(e => e.name && !e.name.startsWith('.'));

            if (validFolders.length > 0) {
                preloadedContainer.classList.remove('hidden');
                preloadedList.innerHTML = '';

                validFolders.forEach(folder => {
                    const btn = document.createElement('button');
                    btn.className = 'dataset-pill';

                    let displayName = folder.name.replace(/_/g, ' ');
                    if (folder.name === 'Boys_Apparels') displayName = "Boy's Apparels";
                    if (folder.name === 'Girls_Apparels') displayName = "Girl's Apparels";
                    if (folder.name === 'Men_Footwear') displayName = "Men's Footwear";
                    if (folder.name === 'Women_Footwear') displayName = "Women's Footwear";

                    btn.textContent = displayName;
                    btn.addEventListener('click', async () => {
                        try {
                            updateStatus(`Scanning ${displayName}...`, true);
                            const imageUrls = await scanDatasetDirectory(folder.path);
                            if (imageUrls.length === 0) {
                                alert("No compatible images found in this folder.");
                                updateStatus("Awaiting dataset selection", false);
                                return;
                            }

                            await resetDatabase();
                            setEmbeddingCache([]);
                            isReady = false;

                            // Prevent overlapping clicks
                            clearUploadBtn.click();
                            preloadedContainer.classList.add('hidden');
                            datasetContainer.classList.add('hidden');

                            await handleDatasetProcessing(imageUrls);

                            // Re-show preloaded buttons when done
                            preloadedContainer.classList.remove('hidden');
                        } catch (err) {
                            console.error("Failed to load custom dataset:", err);
                        }
                    });
                    preloadedList.appendChild(btn);
                });
            }
        }
    } catch (e) {
        console.warn("Custom datasets folder not found or accessible.", e);
    }
}

/**
 * Handles processing images, extracting embeddings, and saving to DB.
 */
async function handleDatasetProcessing(items) {
    progressContainer.classList.remove('hidden');
    datasetContainer.classList.add('hidden');

    updateStatus("Extracting features...", true);

    const results = await processDataset(items, (current, total) => {
        const percent = (current / total) * 100;
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `Processed ${current} of ${total} images`;
    });

    updateStatus("Saving to database...", true);
    await saveEmbeddingsBatch(results);

    // Set Persistence Flag
    await setMeta('embeddingsGenerated', true);

    progressContainer.classList.add('hidden');
    updateStatus(`Ready (${results.length} images indexed)`, false);

    await loadEmbeddingsIntoMemory();
    enableUI();
}

async function loadEmbeddingsIntoMemory() {
    const dbEmbeddings = await getAllEmbeddings();
    setEmbeddingCache(dbEmbeddings);
}

function enableUI() {
    isReady = true;
    dropzone.classList.remove('disabled');
    datasetContainer.classList.remove('hidden');
}

// ---------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------

// Tauri Folder Selection
selectDatasetBtn.addEventListener('click', async () => {
    try {
        const selectedPath = await open({
            directory: true,
            multiple: false,
            title: "Select Dataset Folder"
        });

        if (selectedPath) {
            updateStatus("Scanning dataset...", true);
            const imageUrls = await scanDatasetDirectory(selectedPath);
            if (imageUrls.length === 0) {
                alert("No compatible images found in the selected folder.");
                updateStatus("Awaiting dataset selection", false);
                return;
            }

            setEmbeddingCache([]);
            isReady = false;
            dropzone.classList.add('disabled');

            await handleDatasetProcessing(imageUrls);
        }
    } catch (e) {
        console.error("Dataset selection failed:", e);
    }
});

// Drag and Drop Logic
dropzone.addEventListener('dragover', (e) => {
    if (!isReady) return;
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    if (!isReady) return;
    e.preventDefault();
    dropzone.classList.remove('dragover');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files[0]);
    }
});

function handleUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
    }

    queryImageFile = file;
    const objectUrl = URL.createObjectURL(file);
    imagePreview.src = objectUrl;

    previewContainer.classList.remove('hidden');
    searchBtn.disabled = false;
}

// Clear Upload
clearUploadBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent clicking dropzone
    queryImageFile = null;
    imagePreview.src = '';
    previewContainer.classList.add('hidden');
    searchBtn.disabled = true;
});

// Click dropzone to open Tauri file dialog
dropzone.addEventListener('click', async (e) => {
    if (e.target === clearUploadBtn || e.target === imagePreview) return;
    if (!isReady || queryImageFile) return;

    try {
        const selectedPath = await open({
            multiple: false,
            filters: [{
                name: 'Images',
                extensions: ['png', 'jpeg', 'jpg', 'webp']
            }]
        });

        if (selectedPath) {
            queryImageFile = selectedPath;
            imagePreview.src = convertFileSrc(selectedPath);
            previewContainer.classList.remove('hidden');
            searchBtn.disabled = false;
        }
    } catch (err) {
        console.error("Failed to open file dialog:", err);
    }
});

// Search Logic
searchBtn.addEventListener('click', async () => {
    if (!queryImageFile || !isReady || !searchWorker) return;

    try {
        searchBtn.disabled = true;
        const originalText = searchBtn.textContent;
        searchBtn.textContent = "Analyzing...";

        const startTimestamp = performance.now();

        // Load image for TFJS (via Canvas resizing)
        let objectUrl;
        if (typeof queryImageFile === 'string') {
            objectUrl = queryImageFile;
        } else {
            objectUrl = URL.createObjectURL(queryImageFile);
        }

        const imgObj = await loadImage(objectUrl);

        if (typeof queryImageFile !== 'string') {
            URL.revokeObjectURL(objectUrl);
        }

        // Extract and normalize embedding natively
        const queryEmbedding = await extractEmbedding(imgObj);

        // Send to Worker
        searchWorker.onmessage = (e) => {
            const topMatches = e.data.matches;

            const endTimestamp = performance.now();
            console.log(`Search completed in ${endTimestamp - startTimestamp} ms`);

            // Render Results
            renderResults(topMatches);

            searchBtn.textContent = originalText;
            searchBtn.disabled = false;
        };

        searchWorker.onerror = (err) => {
            console.error("Worker error:", err);
            alert("Search failed due to worker crash.");
            searchBtn.disabled = false;
            searchBtn.textContent = originalText;
        };

        // Transfer Data and Cache Array over Message Event
        searchWorker.postMessage({
            queryEmbedding: queryEmbedding,
            embeddingCache: getEmbeddingCache(),
            topK: 5
        });

    } catch (error) {
        console.error("Search failed:", error);
        alert("Search failed. See console.");
        searchBtn.disabled = false;
    }
});

function renderResults(matches) {
    resultsGrid.innerHTML = '';
    matchCount.textContent = matches.length.toString();

    if (matches.length === 0) {
        resultsGrid.innerHTML = `<div class="empty-state"><p>No matches found.</p></div>`;
        return;
    }

    matches.forEach((match, index) => {
        // Convert similarity score to percentage
        const percent = Math.max(0, Math.round(match.score * 100));

        // Use Tauri custom protocol for local absolute paths
        const imageSrc = convertFileSrc(match.imagePath);

        // Slight delay for animation cascading
        setTimeout(() => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <div class="result-image-wrapper">
                    <img src="${imageSrc}" class="result-image" alt="Similar Match" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzNzQxNTEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2YzZjRmNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgbWlzc2luZzwvdGV4dD48L3N2Zz4='">
                </div>
                <div class="result-info">
                    <span class="match-rank">#${index + 1}</span>
                    <span class="similarity-score">${percent}% Match</span>
                </div>
                <div class="similarity-bar-bg">
                    <div class="similarity-bar-fill" style="width: ${percent}%"></div>
                </div>
            `;
            resultsGrid.appendChild(card);
        }, index * 100);
    });
}

// Initialize on DOM Load
window.addEventListener('DOMContentLoaded', initApp);
