/**
 * embedding.js
 * Module to handle loading MobileNet via TensorFlow.js and extracting 
 * feature embeddings (1000-dimensional arrays) from images.
 */

let model = null;

/**
 * Initializes TensorFlow.js and loads the MobileNet model.
 */
export async function initializeModel(onProgress) {
    if (onProgress) onProgress("Setting up TensorFlow.js...");
    await tf.ready();

    if (onProgress) onProgress("Loading MobileNet model...");
    // Load MobileNet version 2
    model = await mobilenet.load({ version: 2, alpha: 1.0 });

    // Warm up the model 
    // (Creates a dummy tensor to compile WebGL shaders so the first real prediction is fast)
    const lazyTensor = tf.zeros([1, 224, 224, 3]);
    model.infer(lazyTensor, true);
    lazyTensor.dispose();

    if (onProgress) onProgress("Model Ready");
    return model;
}

/**
 * Extracts a feature embedding from an Image or Canvas element,
 * and performs L2 Normalization so similarities can be calculated 
 * as simple dot products.
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} imgElement 
 * @returns {Promise<Float32Array>} The generated, normalized Float32Array embedding
 */
export async function extractEmbedding(imgElement) {
    if (!model) {
        throw new Error("MobileNet model is not loaded yet.");
    }

    // infer(image, true) gets the embeddings instead of the classification classes
    const logits = model.infer(imgElement, true);

    // Get the array data natively as Float32Array
    const rawArray = await logits.data();

    // Cleanup tensor to prevent memory leaks
    logits.dispose();

    // ----------------------------------------------------
    // Normalize Embedding (Upgrade Step 3)
    // ----------------------------------------------------
    let magnitudeSq = 0;
    for (let i = 0; i < rawArray.length; i++) {
        magnitudeSq += rawArray[i] * rawArray[i];
    }
    const magnitude = Math.sqrt(magnitudeSq);

    const normalizedArray = new Float32Array(rawArray.length);
    if (magnitude > 0) {
        for (let i = 0; i < rawArray.length; i++) {
            normalizedArray[i] = rawArray[i] / magnitude;
        }
    } else {
        // Fallback for zero vector (rare)
        normalizedArray.set(rawArray);
    }

    return normalizedArray;
}
