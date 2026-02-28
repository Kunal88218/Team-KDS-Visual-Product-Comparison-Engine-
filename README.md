# Visual Product Comparison Engine

## Brief Description
A completely offline AI-based visual search application that allows the user to upload an image of the product and find visually similar products from the local catalog in an instant by leveraging the power of machine learning.

---

# Problem Statement

## Problem Title
Offline Visual Product Similarity Search using On-Device Machine Learning

## Problem Description
The majority of online customers tend to search for the product visually, not by typing the product's name in the search bar. The majority of the visual search applications make use of cloud APIs, resulting in increased latency, cost, and privacy issues. There is no such desktop application that can perform the feature extraction of the images, store the feature vectors, and compare them in an efficient manner without relying on any cloud infrastructure.

## Target Users
- Online shoppers
- E-commerce platforms
- Small & medium retailers
- Fashion stores
- Privacy-conscious users
- Developers building AI tools

## Existing Gaps
- Cloud dependency
- High infrastructure cost
- Privacy risks from image uploads
- Lack of offline visual search systems
- Limited client-side ML implementations

---

# Problem Understanding & Approach

## Root Cause Analysis
Computers cannot recognize images on their own. They require images to be converted to numerical feature vectors (embeddings). Therefore, without efficient feature extraction and comparison, image search is not accurate or efficient.

## Solution Strategy
- Use TensorFlow.js for local feature extraction
- Convert images to embeddings using MobileNet
- Store embeddings in IndexedDB
- Compare embeddings using cosine similarity
- Rank and display visually similar products
- Ensure full offline functionality

---

# Proposed Solution

## Solution Overview
A client-side image search engine that performs image feature extraction locally and compares it to existing product embeddings without any cloud API.

## Core Idea
Images are converted to vector form, compared mathematically, and then compared to find similarity.

## Key Features
- Offline operation
- Drag-and-drop image upload
- Real-time similarity comparison
- Local embedding storage
- Fast inference
- Privacy-friendly
- Lightweight architecture

---

# System Architecture

## High-Level Flow
```
User → Frontend → TensorFlow.js → MobileNet → IndexedDB → Similarity Engine → Results
```

## Architecture Description
1. User uploads an image.
2. Canvas API extracts pixel data.
3. TensorFlow.js processes image tensor.
4. MobileNet generates embedding vector.
5. IndexedDB retrieves stored embeddings.
6. Cosine similarity compares vectors.
7. Results are ranked and displayed.

## Architecture Diagram
(Add system architecture diagram image here)

---

# Database Design

## ER Diagram
(Add ER diagram image here)

## ER Diagram Description

Entity: Product

Attributes:
- product_id (Primary Key)
- product_name
- image_path
- embedding_vector

Each product has one embedding vector used for similarity comparison.

---

# Dataset Selected

## Dataset Name
Fashion Product Images Dataset

## Source
Kaggle

## Data Type
- JPG / PNG product images
- Fashion products (shoes, clothing, accessories)

## Selection Reason
- Diverse product images
- Suitable for similarity tasks
- Lightweight and manageable size

## Preprocessing Steps
```
Resize images
Convert to tensor
Extract embeddings
Store embeddings in IndexedDB
```

---

# Model Selected

## Model Name
MobileNet

## Selection Reasoning
- Lightweight
- Fast inference
- Browser compatible
- Good balance of speed and accuracy

## Alternatives Considered
- ResNet50
- EfficientNet
- VGG16

## Evaluation Metrics
- Cosine similarity score
- Response time
- Accuracy of similar results

---

# Technology Stack

## Frontend
- HTML
- CSS
- JavaScript
- Canvas API

## Backend
No backend required (fully client-side)

## ML/AI
- TensorFlow.js
- MobileNet

## Database
- IndexedDB

## Deployment
- GitHub Pages
- Netlify
- Vercel

---

# Installation Guide

## Prerequisites
- Node.js installed
- Modern browser (Chrome recommended)

## Setup Steps

```bash
git clone https://github.com/your-repo/visual-search.git
cd visual-search
npm install
npm run dev
```

## Production Build
```bash
npm run build
```

---

# API Documentation (If Backend Added)

## Endpoint 1: Upload Image
```
POST /upload
```

## Endpoint 2: Get Similar Products
```
GET /similar-products
```

## Endpoint 3: Store Embedding
```
POST /store-embedding
```

(Add API testing screenshots here)

---

# Module-wise Development & Deliverables

## Checkpoint 1: Research & Planning
- Problem analysis
- Architecture design
- Tech stack selection

## Checkpoint 2: Backend Development
- IndexedDB setup
- Embedding storage logic

## Checkpoint 3: Frontend Development
- Upload interface
- Results display

## Checkpoint 4: Model Integration
- MobileNet integration
- Embedding extraction

## Checkpoint 5: Similarity Engine
- Cosine similarity implementation
- Ranking system

## Checkpoint 6: Deployment
- Live hosting
- Documentation

---

# End-to-End Workflow
```
User uploads image
↓
Image converted to pixels
↓
MobileNet generates embedding
↓
Stored embeddings retrieved
↓
Similarity computed
↓
Results ranked and displayed
```

---

# Demo & Links

Live Demo:

Demo Video:

GitHub Repository:

---

# Team Roles & Responsibilities

Kunal Singh Kushwaha : FrontEnd & Logic

Sharanyo Banerjee : Backend & Database

Dipesh Kumar : PPT , Questions & Miscellaneous

---

# Future Scope & Scalability

## Short-Term
- Add filters and categories
- Improve UI
- Increase dataset size

## Long-Term
- WebGPU acceleration
- Hybrid cloud support
- Real-time camera search
- Support millions of products

---

# Known Limitations
- Limited by browser memory
- Accuracy depends on dataset
- MobileNet less accurate than heavier models
- Local storage constraints

---

# Impact
This project enables fast, private, and cost-efficient visual product search directly on user devices, reducing infrastructure costs and improving user experience while protecting data privacy.
