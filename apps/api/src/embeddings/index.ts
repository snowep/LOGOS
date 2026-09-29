import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = true;
env.useBrowserCache = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;

let embedder: any = null;

export async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model...');
    embedder = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    console.log('Embedding model loaded');
  }
  return embedder;
}

export async function generateEmbedding(text: string): Promise<Float32Array> {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return output.data as Float32Array;
}

export async function generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
  const extractor = await getEmbedder();
  const results: Float32Array[] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    results.push(output.data as Float32Array);
  }
  return results;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function embeddingToBuffer(embedding: Float32Array): Buffer {
  return Buffer.from(embedding.buffer);
}

export function bufferToEmbedding(buffer: Buffer): Float32Array {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

export const EMBEDDING_CONFIG = {
  model: MODEL_NAME,
  dimensions: EMBEDDING_DIM,
  similarityThreshold: 0.75,
};