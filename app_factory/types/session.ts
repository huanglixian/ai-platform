export type AppFactorySessionStatus = "idle" | "running" | "error";
export type AppFactorySession = {
  id: string;
  projectId: string;
  status: AppFactorySessionStatus | string;
  harness: "pi" | string;
  title: string;
  createdAt: string;
  updatedAt: string;
  piStatus?: PiSessionStatus;
};

export type PiSessionStatus = "new" | "ready" | "missing";

const SESSION_TITLE_LIMIT = 33;

export function deriveSessionTitle(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) return "新对话";
  return normalized.length > SESSION_TITLE_LIMIT
    ? `${normalized.slice(0, SESSION_TITLE_LIMIT)}…`
    : normalized;
}

export function getSessionStatusLabel(status: string) {
  if (status === "running") return "处理中";
  if (status === "error") return "需关注";
  return "已就绪";
}

export function getPiSessionStatus(input: {
  hasTranscript: boolean;
  hasPiSession: boolean;
}): PiSessionStatus {
  if (!input.hasTranscript && !input.hasPiSession) return "new";
  if (input.hasPiSession) return "ready";
  return "missing";
}

export function getPiSessionStatusLabel(status: PiSessionStatus) {
  if (status === "missing") return "上下文缺失";
  if (status === "ready") return "上下文已保存";
  return "未开始";
}
