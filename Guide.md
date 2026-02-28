# Visual Product Comparison Engine

Welcome to the Visual Product Comparison Engine! This application is a fully native, offline, lightning-fast desktop application built specifically for macOS. It uses on-device AI to find visually similar products within your custom merchandise datasets.

## Features

- **100% Offline AI Search:** All embedding extraction and similarity matching happen locally on your device without sending any data to the cloud.
- **Lightning Fast Performance:** Uses TensorFlow.js with the MobileNet v2 architecture and utilizes an in-memory `Float32Array` embedding cache for near-instant similarity lookups.
- **Tauri Desktop Native:** A lightweight, high-performance desktop wrapper for the UI, offering native file system and dialogue access.
- **Preloaded Custom Datasets:** Automatically scans your local `CustomDataset` directory and generates handy shortcut buttons for instant, preloaded dataset indexing.
- **Simple Drag and Drop:** Easily drag your query image directly into the application to find visually similar products.

## How to Download and Install (Mac Only)

Currently, the application is compiled and optimized exclusively for macOS. 

To download and run:
1. Navigate to the `Visual_Product_Comparer_Desktop/src-tauri/target/release/bundle/macos/` directory within this repository.
2. Locate the `visual-product-comparer.app` application bundle.
3. Simply drag or copy `visual-product-comparer.app` to your Mac's `/Applications` folder.
4. Double-click the application to launch it.

Alternatively, you can run the provided `.dmg` installer located in `Visual_Product_Comparer_Desktop/src-tauri/target/release/bundle/dmg/`.

## How to Use

1. **Launch the App:** Open the Visual Product Comparer on your Mac.
2. **Select a Dataset:**
   - Under the "Find Similar Products" section, click "**Select Dataset Folder**" and choose a folder on your computer that contains product images (.jpg, .png, .webp).
   - *Alternatively*, click any of the **Preloaded Datasets** pills (like "Boy's Apparels") found under the right-hand column.
3. **Wait for Indexing:** A progress bar will appear as the AI scans the folder and extracts features. This data is securely stored offline in your computer's `storage/` directory so you won't have to scan the same folder twice.
4. **Search:** Drag and drop an image into the upload box (or click "Browse Files"). 
5. **View Results:** Click "**Search Similar**". The top 5 closest matching product images from your dataset will immediately appear on the right side along with their similarity percentage.

## Credits

*Developed for the Team KDS Visual Product Comparison Engine.*
