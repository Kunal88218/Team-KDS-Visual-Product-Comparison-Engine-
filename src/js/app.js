/**
 * app.js
 * Main entry point. Orchestrates the UI logic, MobileNet initialization, 
 * database extraction, and search functionality.
 */

import { initializeModel, extractEmbedding } from './embedding.js';
import { initDB, countEmbeddings, saveEmbeddingsBatch, getAllEmbeddings, getMeta, setMeta } from './database.js';
import { tryFetchDataset, processDataset, loadImage } from './datasetLoader.js';
import { setEmbeddingCache, getEmbeddingCache, appendToEmbeddingCache } from './cache.js';

// DOM Elements
const statusText = document.getElementById('status-text');
const statusLoader = document.getElementById('status-loader');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const fallbackContainer = document.getElementById('fallback-container');

const dropzone = document.getElementById('dropzone');
const fileUpload = document.getElementById('file-upload');
const folderUpload = document.getElementById('folder-upload');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const clearUploadBtn = document.getElementById('clear-upload-btn');
const searchBtn = document.getElementById('search-btn');

const resultsGrid = document.getElementById('results-grid');
const matchCount = document.getElementById('match-count');

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
            // First time setup: Try to fetch public/dataset/
            updateStatus("Scanning dataset...", true);
            try {
                const imageUrls = await tryFetchDataset();
                if (imageUrls.length === 0) throw new Error("No images found");

                await handleDatasetProcessing(imageUrls);
            } catch (e) {
                // Fetch failed (Likely file:// protocol). Show fallback UI.
                console.warn(e.message);
                showFallbackUI();
            }
        }
    } catch (error) {
        console.error("Initialization error:", error);
        updateStatus("Failed to initialize. Check console.", false);
        statusText.style.color = "var(--accent)";
    }
}

function initWorker() {
    searchWorker = new Worker('src/js/searchWorker.js');
}

function updateStatus(message, showLoader = false) {
    statusText.textContent = message;
    statusLoader.style.display = showLoader ? 'inline-block' : 'none';
}

function showFallbackUI() {
    updateStatus("Awaiting dataset selection", false);
    fallbackContainer.classList.remove('hidden');
}

/**
 * Handles processing images, extracting embeddings, and saving to DB.
 */
async function handleDatasetProcessing(items) {
    progressContainer.classList.remove('hidden');
    fallbackContainer.classList.add('hidden');

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
    fileUpload.disabled = false;
}

// ---------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------

// Fallback folder selection
folderUpload.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
        alert("No images found in selected folder.");
        return;
    }
    await handleDatasetProcessing(files);
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

// File input logic
fileUpload.addEventListener('change', (e) => {
    if (!isReady) return;
    if (e.target.files && e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
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
    fileUpload.value = '';
});

// Prevent triggering file input if clicking clear button
dropzone.addEventListener('click', (e) => {
    if (e.target === clearUploadBtn || e.target === imagePreview) return;
    if (isReady && !queryImageFile) {
        fileUpload.click();
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
        const objectUrl = URL.createObjectURL(queryImageFile);
        const imgObj = await loadImage(objectUrl);
        URL.revokeObjectURL(objectUrl);

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
        // (Assuming score is between -1 and 1, usually 0 to 1 for visual features)
        const percent = Math.max(0, Math.round(match.score * 100));

        // Resolve image source. If it's a URL it will just work. 
        // If the user uploaded a folder, the path is stored as `item.name`. We need objectURLs for that, 
        // but since we can't persist ObjectURLs inside IndexedDB across reloads, 
        // we assume for this pure frontend app that we're mostly using the `public/dataset/` relative paths.
        // If offline mode is heavily used, storing base64 in DB is needed, but that explodes storage space.
        // For our `public/dataset/` requirement, it's fine.
        let imageSrc = match.imagePath;
        if (!imageSrc.startsWith('./') && !imageSrc.startsWith('/')) {
            // It's likely just a filename matched from folder upload
            // We prepend the dataset path so it works when hosted. 
            imageSrc = `./public/dataset/${imageSrc}`;
        }

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
