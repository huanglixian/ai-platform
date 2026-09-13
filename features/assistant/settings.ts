import { getAgentHubDatabase } from "@/lib/agenthub/database";

export const defaultUnmatchedGuide = "目前似乎没有功能可以直接满足你的需求。你可以浏览平台现有能力，或补充更具体的业务目标。";

export type AssistantSettings = {
  unmatchedGuide: string;
  updatedAt: string;
};

function ensureAssistantSettings() {
  const database = getAgentHubDatabase();
  database.prepare(`INSERT OR IGNORE INTO assistant_settings (id, unmatched_guide, updated_at) VALUES (1, ?, ?)`)
    .run(defaultUnmatchedGuide, new Date().toISOString());
  return database;
}

export function getAssistantSettings(): AssistantSettings {
  const row = ensureAssistantSettings().prepare("SELECT unmatched_guide, updated_at FROM assistant_settings WHERE id=1")
    .get() as { unmatched_guide: string; updated_at: string };
  return { unmatchedGuide: row.unmatched_guide, updatedAt: row.updated_at };
}

export function updateAssistantSettings(unmatchedGuide: string): AssistantSettings {
  const database = ensureAssistantSettings();
  const updatedAt = new Date().toISOString();
  database.prepare("UPDATE assistant_settings SET unmatched_guide=?, updated_at=? WHERE id=1")
    .run(unmatchedGuide, updatedAt);
  return { unmatchedGuide, updatedAt };
}
