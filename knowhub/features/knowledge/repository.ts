import "server-only";

import {
  readKnowledgeRunStore,
  readKnowledgeStore,
  writeKnowledgeRunStore,
  writeKnowledgeStore,
} from "@/knowhub/features/knowledge/storage";
import type {
  KnowledgeRunRecord,
  KnowledgeRunStore,
  KnowledgeStore,
  PipelineRecord,
} from "@/knowhub/features/knowledge/types";

async function getKnowledgeStore() {
  const store = await readKnowledgeStore();

  if (store) {
    return store;
  }

  const nextStore: KnowledgeStore = {
    items: [],
  };

  await writeKnowledgeStore(nextStore);
  return nextStore;
}

async function getKnowledgeRunStore() {
  const store = await readKnowledgeRunStore();

  if (store) {
    return store;
  }

  const nextStore: KnowledgeRunStore = {
    items: [],
  };

  await writeKnowledgeRunStore(nextStore);
  return nextStore;
}

export async function listStoredKnowledgeItems() {
  const store = await getKnowledgeStore();
  return store.items;
}

export async function getStoredKnowledgeById(id: string) {
  const store = await getKnowledgeStore();
  return store.items.find((item) => item.id === id) ?? null;
}

export async function saveStoredKnowledge(item: PipelineRecord) {
  const store = await getKnowledgeStore();
  await writeKnowledgeStore({
    items: [item, ...store.items],
  });

  return item;
}

export async function updateStoredKnowledge(
  id: string,
  updater: (item: PipelineRecord) => PipelineRecord,
) {
  const store = await getKnowledgeStore();
  const index = store.items.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  const nextItem = updater(store.items[index]);
  const nextItems = [...store.items];
  nextItems[index] = nextItem;

  await writeKnowledgeStore({
    items: nextItems,
  });

  return nextItem;
}

export async function listStoredKnowledgeRuns(knowledgeId?: string) {
  const store = await getKnowledgeRunStore();

  if (!knowledgeId) {
    return store.items;
  }

  return store.items.filter((item) => item.knowledgeId === knowledgeId);
}

export async function saveStoredKnowledgeRun(item: KnowledgeRunRecord) {
  const store = await getKnowledgeRunStore();
  await writeKnowledgeRunStore({
    items: [item, ...store.items],
  });

  return item;
}

export async function updateStoredKnowledgeRun(
  id: string,
  updater: (item: KnowledgeRunRecord) => KnowledgeRunRecord,
) {
  const store = await getKnowledgeRunStore();
  const index = store.items.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  const nextItem = updater(store.items[index]);
  const nextItems = [...store.items];
  nextItems[index] = nextItem;

  await writeKnowledgeRunStore({
    items: nextItems,
  });

  return nextItem;
}
