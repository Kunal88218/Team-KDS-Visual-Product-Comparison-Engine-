# Visual Product Comparer

A fully offline AI visual similarity search web app for apparel images using TensorFlow.js and MobileNet, processing entirely in the client's browser.

## Features
- **100% Client-side Processing**: No backend servers or APIs needed.
- **Offline Capable**: Uses IndexedDB for storing image embeddings.
- **AI-powered**: Leverages TensorFlow.js and a pre-trained MobileNet model.
- **Privacy-first**: No images are uploaded to any server. All processing runs locally.

## Project Structure
```
├── index.html                  # Main UI and application entry point
├── src/
│   ├── js/
│   │   ├── app.js              # Main controller logic, UI orchestrator
│   │   ├── embedding.js        # MobileNet and TF.js wrapper for feature extraction
│   │   ├── database.js         # IndexedDB operations for storing/retrieving embeddings
│   │   ├── similarity.js       # Cosine similarity logic to compare embeddings
│   │   └── datasetLoader.js    # Logic for loading public/dataset images dynamically
│   └── styles/
│       └── style.css           # Styling
├── public/
│   └── dataset/                # Initial apparel image dataset (JPG/JPEG)
├── package.json
└── README.md
```

## Setup & Running

1. **Host Context (Recommended):**
   Because modern web browsers block web pages loaded via `file://` from performing fetch requests to the local directory (due to CORS/security restrictions), it is recommended to run a lightweight local file server to serve the directory.
   
   If you have Python installed:
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`. The application will automatically scan the `public/dataset/` folder.

2. **Offline/Direct `file://` Mode:**
   You can still open `index.html` directly in your browser without a server! 
   However, the app cannot automatically crawl the `public/dataset/` folder for security reasons. Instead, the UI will prompt you to **Select Dataset Folder**. Simply point it to the `public/dataset/` directory on your hard drive, and it will index the images offline.

## How It Works
- **Embeddings**: When the app initializes (or when a folder is selected), it opens each image, passes it through the MobileNet neural network, and extracts a dense vector representation (embedding) of the image features.
- **IndexedDB**: The 1000-dimensional embedding arrays, along with the image paths, are stored in the browser's IndexedDB so they don't have to be re-calculated every time you open the app.
- **Similarity**: When you upload a query image, its embedding is extracted on-the-fly. The system then computes the Cosine Similarity between this query embedding and all the embeddings stored in IndexedDB to find the nearest matches.

## Technologies Used
- HTML / CSS / Vanilla JS (ES Modules)
- [TensorFlow.js](https://js.tensorflow.org/)
- [MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- IndexedDB (Browser Storage)
