import "server-only";

import { createHash } from "crypto";

const EMBEDDING_DIMENSION = 384;

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(/[\s,.;:!?()[\]{}"'/\\|<>`~@#$%^&*_+=-]+/)
    .filter(Boolean);
}

function normalizeVector(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!norm) {
    return vector;
  }

  return vector.map((value) => value / norm);
}

function createBuiltinEmbedding(text: string) {
  const tokens = tokenize(text);
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);

  if (!tokens.length) {
    return vector;
  }

  tokens.forEach((token, index) => {
    const hash = createHash("sha1").update(`${index}:${token}`, "utf8").digest();
    const bucket = hash.readUInt32BE(0) % EMBEDDING_DIMENSION;
    const weight = (hash.readUInt16BE(4) % 1000) / 1000 + 0.5;
    const sign = hash[6] % 2 === 0 ? 1 : -1;
    vector[bucket] += weight * sign;
  });

  return normalizeVector(vector);
}

export async function embedTexts(texts: string[]) {
  return texts.map((text) => createBuiltinEmbedding(text));
}

export function getEmbeddingModelName() {
  return "builtin-hash-384";
}

export function getEmbeddingDimension() {
  return EMBEDDING_DIMENSION;
}
