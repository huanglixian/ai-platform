import "server-only";

import { ensureVectorStore, SqliteVecStore } from "@/knowhub/features/vector-store/sqlite-vec-store";

let store: SqliteVecStore | null = null;

export async function getVectorStore() {
  await ensureVectorStore();

  if (!store) {
    store = new SqliteVecStore();
  }

  return store;
}
