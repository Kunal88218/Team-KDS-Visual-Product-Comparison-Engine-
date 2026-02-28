# Visual Product Comparison Engine

A fully offline AI visual similarity search desktop application for finding visually similar products from local catalogs using on-device machine learning.

[**🔗 Click here to read the Comprehensive Setup & Features Guide for the new Tauri Desktop App**](Guide.md)

---

## 1. Problem Statement

### Problem Title
Offline Visual Product Similarity Search using On-Device Machine Learning

### Problem Description
The majority of online customers tend to search for products visually, not by typing the product's name in the search bar. However, the majority of visual search applications make use of cloud APIs, resulting in increased latency, cost, and privacy issues. There is a lack of efficient desktop applications capable of performing feature extraction, storing feature vectors, and comparing them instantly without relying on any cloud infrastructure.

### Target Users
- Online shoppers
- E-commerce platforms
- Small & medium retailers
- Fashion stores
- Privacy-conscious users
- Developers building AI tools

### Existing Gaps
- Cloud dependency
- High infrastructure cost
- Privacy risks from image uploads
- Lack of offline visual search systems
- Limited client-side ML implementations

---

## 2. Problem Understanding & Approach

### Root Cause Analysis
Computers cannot recognize images directly. They require images to be mathematically converted to numerical feature vectors (embeddings). Without an efficient, local mechanism for feature extraction and vector comparison, image search cannot be both private and accurate.

### Solution Strategy
- Use TensorFlow.js for local feature extraction
- Convert images to dense embeddings utilizing MobileNet
- Store embeddings offline using native OS storage APIs
- Compare embeddings mathematically using Cosine Similarity
- Rank and display visually similar products instantly
- Ensure 100% offline functionality natively on macOS

---

## 3. Proposed Solution

### Solution Overview
A fully-native client-side image search engine that performs image feature extraction locally and compares it against an ingested product embedding catalog without utilizing any cloud API.

### Core Idea
Images are converted to a multi-dimensional vector format via a neural network, compared mathematically against known vectors using dot-products, and mathematically ranked to find exact visual similarity.

### Key Features
- Native macOS Desktop Application (Tauri)
- 100% Offline operation
- Drag-and-drop Image Upload
- Real-time similarity comparison (< 100ms)
- Local native disk embedding storage (`embeddings.bin`)
- Fast inference leveraging WebGL
- Privacy-friendly architecture
- Pre-loaded Custom Datasets UI 

---

## 4. System Architecture

### High-Level Flow
```
User → Frontend (React/Vanilla JS) → TensorFlow.js → MobileNet → Native Filesystem DB → Similarity Engine → Results
```

### Architecture Description
1. User uploads an image via native file dialog or drag-and-drop.
2. Web API / Canvas extracts specific image pixel data.
3. TensorFlow.js processes the image tensor using GPU/WebGL.
4. MobileNet neural network generates a fixed-length 1D embedding vector.
5. The local native database loads stored embedding vectors (`Float32Array`).
6. High-performance Cosine similarity compares the vectors sequentially.
7. Results are computationally ranked and rendered visually.

### Architecture Diagram
*(Add system architecture diagram image here)*

---

## 5. Database Design

### ER Diagram
*(Add ER diagram image here)*

### ER Diagram Description
- Native Flat-file structure utilizing binary array buffers for ultra-fast load times.
- `metadata.json` maps file paths and initialization states.
- `embeddings.bin` statically stores consecutive neural network Float32 vector arrays.

---

## 6. Dataset Selected

### Dataset Name
Fashion Product Images Dataset

### Source
Kaggle

### Data Type
- JPG / PNG / WebP product images
- Fashion products (Boys Apparels, Footwear, Accessories, etc.)

### Selection Reason
- Diverse product baseline
- Optimal for visual variance and similarity tasks
- Handled effectively by edge-device ML models

### Preprocessing Steps
1. Standardize and resize images onto an HTML Canvas
2. Construct TensorFlow 4D Tensors
3. Feed through MobileNet and extract raw logits
4. L2 Normalize output vectors for efficient dot-product math
5. Serialize directly into offline local Disk Storage

---

## 7. Model Selected

### Model Name
MobileNet v2

### Selection Reasoning
- Extremely lightweight size (optimized for browser/desktop engines)
- Highly-optimized fast inference
- Natively compatible with TensorFlow.js WebGL backend
- Optimal sweet spot between computational cost and vector accuracy

### Alternatives Considered
- ResNet50 (Too computationally expensive for edge devices)
- EfficientNet
- VGG16 (Large file size footprints)

### Evaluation Metrics
- Cosine similarity correlation score
- Total inference time per image (ms)
- Overall search response latency time

---

## 8. Technology Stack

### Frontend
- HTML5 / CSS3 (Grid/Flexbox UI)
- Vanilla JavaScript (ES6+ Modules)
- Canvas API

### Backend / Desktop Framework
- Rust / Tauri App Framework (macOS app generation)
- `@tauri-apps/api/fs` & `@tauri-apps/api/dialog`

### ML/AI
- TensorFlow.js
- MobileNet v2

### Database
- Tauri Native File System API Flat-files (`.json` + `.bin`)

### Deployment
- GitHub Repository (Source Code)
- Native `.dmg` / `.app` Executable Bundles (Distribution)

---

## 9. API Documentation & Testing

### API Endpoints List
*(Fully Offline Application - No Cloud APIs present. Interactions bridge standard Web APIs with Tauri IPC backend commands.)*

### Endpoint 1:
Local File Dialog Selector (`@tauri-apps/api/dialog`)

### Endpoint 2:
Read/Write Binary Engine (`@tauri-apps/api/fs`)

### Endpoint 3:
Worker Thread Interconnect (`Web Workers API`)

### API Testing Screenshots
*(Add Tauri backend interaction / console screenshots here)*

---

## 10. Module-wise Development & Deliverables

### Checkpoint 1: Research & Planning
**Deliverables:**
- Offline similarity problem analysis
- Tauri wrapper architecture design
- Tech stack finalization (TF.js + Rust)

### Checkpoint 2: Backend Development
**Deliverables:**
- Tauri project bootstrapping (`Cargo.toml`)
- Local Flat-file database layer construction
- `Uint8Array` serialization methodology

### Checkpoint 3: Frontend Development
**Deliverables:**
- Drag-and-drop Image upload interface
- Similarity percentage loading grid
- Dynamic pre-loaded datasets section

### Checkpoint 4: Model Training
**Deliverables:**
- Leveraging pre-trained ImageNet topology on MobileNet.

### Checkpoint 5: Model Integration
**Deliverables:**
- MobileNet WebGL integration
- Feature Vector (embedding) extraction and mathematical normalization

### Checkpoint 6: Deployment
**Deliverables:**
- `visual-product-comparer.app` compilation
- macOS `.dmg` installer bundle generation
- GitHub Source hosting

---

## 11. End-to-End Workflow

1. User boots Native macOS App.
2. User selects an offline dataset utilizing the Native File Explorer.
3. TFJS ingests folder contents, generates embeddings, and saves them iteratively to Disk storage.
4. User clicks "Browse Images" to select a Query Image.
5. Query Image undergoes inference and generates an origin Vector.
6. Similarity Search Worker runs against the resident offline DB cache.
7. Top-5 nearest neighbors visually populate alongside percentage-match scores.

---

## 12. Demo & Video

**Live Demo Link:** *[Locally Executed Native App]*

**Demo Video Link:** *(Insert Demo Drive URI)*

**GitHub Repository:** [https://github.com/Kunal88218/Team-KDS-Visual-Product-Comparison-Engine-](https://github.com/Kunal88218/Team-KDS-Visual-Product-Comparison-Engine-)

---

## 13. Hackathon Deliverables Summary
- Open-Source code repository
- Compiled Native Desktop App Package
- Offline ML functionality proof-of-concept
- Extensive Setup / Execution `Guide.md` documentation

---

## 14. Team Roles & Responsibilities

| Member Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Kunal Singh Kushwaha** | FrontEnd & Logic | Client-Side Sorting algorithms, Core UI Development, Worker Threading, Cosine Similarity Engine |
| **Sharanyo Banerjee** | Database & API Integration | Tauri Desktop integration, Local Flat-File Storage Logic, Web Canvas Processing pipeline, Kaggle datasets |
| **Dipesh Kumar** | PPT & Presentation | Video conceptualization, End-to-End demonstrations, Presentation logistics, Helper functions |

---

## 15. Future Scope & Scalability

### Short-Term
- Implement color palettes and dimension-based filter properties
- Refine CSS animations layout
- Integrate larger Kaggle Dataset variants

### Long-Term
- Full WebGPU matrix acceleration implementation
- Multi-OS releases (Windows `.exe`, Linux `AppImage`)
- Real-time webcam hardware inference capture
- Expand capability to 1-Million+ vectorized products seamlessly

---

## 16. Known Limitations
- VRAM limitations governed strictly by user edge hardware (MacBook specs)
- Accuracy governed by MobileNet scope logic compared to heavier cloud LLM/VLM structures
- Large local dataset ingestion takes time upfront to compile indices natively 

---

## 17. Impact
This project creates a paradigm shift for secure visual similarity logic, bringing fast, private, and cost-efficient computer vision directly to local user machines. It slashes cloud infrastructure expenditures completely and provides instantaneous UX responses while strictly protecting data privacy perimeters.
