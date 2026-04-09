import "server-only";

import { ensureVectorStore, SqliteVecStore } from "@/knowhub/features/vector-store/sqlite-vec-store";

let activeDimension = 0;
let store: SqliteVecStore | null = null;

export async function getVectorStore(dimension: number) {
  await ensureVectorStore(dimension);

  if (!store || activeDimension !== dimension) {
    store = new SqliteVecStore(dimension);
    activeDimension = dimension;
  }

  return store;
}
